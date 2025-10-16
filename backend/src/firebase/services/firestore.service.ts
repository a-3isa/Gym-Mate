import { Injectable, Inject } from '@nestjs/common';
import {
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  QuerySnapshot,
  WhereFilterOp,
  DocumentData,
  UpdateData,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase.tokens';

/**
 * FirestoreService
 *
 * Provides helper methods for common Firestore operations.
 * Abstracts Firestore SDK operations and adds error handling.
 */
@Injectable()
export class FirestoreService {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  /**
   * Get a reference to a Firestore collection
   * @param collectionName Name of the collection
   * @returns CollectionReference
   */
  getCollection<T extends DocumentData = DocumentData>(
    collectionName: string,
  ): CollectionReference<T> {
    return this.firestore.collection(collectionName) as CollectionReference<T>;
  }

  /**
   * Get a reference to a specific document
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @returns DocumentReference
   */
  getDocument<T extends DocumentData = DocumentData>(
    collectionName: string,
    docId: string,
  ): DocumentReference<T> {
    return this.firestore.collection(collectionName).doc(docId) as DocumentReference<T>;
  }

  /**
   * Create a new document with optional custom ID
   * @param collectionName Name of the collection
   * @param data Document data
   * @param docId Optional custom document ID
   * @returns Promise<DocumentReference>
   */
  async createDocument<T extends DocumentData = DocumentData>(
    collectionName: string,
    data: T,
    docId?: string,
  ): Promise<DocumentReference<T>> {
    try {
      const collection = this.getCollection<T>(collectionName);

      if (docId) {
        const docRef = collection.doc(docId);
        await docRef.set(data);
        return docRef;
      } else {
        const docRef = await collection.add(data);
        return docRef;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create document in ${collectionName}: ${message}`);
    }
  }

  /**
   * Set a document with optional merge semantics
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @param data Document data
   * @param merge Whether to merge with existing data (default: true)
   * @returns Promise<void>
   */
  async setDocument<T extends DocumentData = DocumentData>(
    collectionName: string,
    docId: string,
    data: T,
    merge = true,
  ): Promise<void> {
    try {
      const docRef = this.getDocument<T>(collectionName, docId);
      await docRef.set(data, { merge });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to set document ${docId} in ${collectionName}: ${message}`);
    }
  }

  /**
   * Update an existing document
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @param data Update data
   * @returns Promise<void>
   */
  async updateDocument<T extends DocumentData = DocumentData>(
    collectionName: string,
    docId: string,
    data: UpdateData<T>,
  ): Promise<void> {
    try {
      const docRef = this.getDocument<T>(collectionName, docId);
      await docRef.update(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update document ${docId} in ${collectionName}: ${message}`);
    }
  }

  /**
   * Delete a document
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @returns Promise<void>
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = this.getDocument(collectionName, docId);
      await docRef.delete();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete document ${docId} from ${collectionName}: ${message}`);
    }
  }

  /**
   * Query documents with multiple filters
   * @param collectionName Name of the collection
   * @param filters Array of filter conditions
   * @returns Promise<QuerySnapshot>
   */
  async queryDocuments<T extends DocumentData = DocumentData>(
    collectionName: string,
    filters: Array<{
      field: string;
      operator: WhereFilterOp;
      value: unknown;
    }>,
  ): Promise<QuerySnapshot<T>> {
    try {
      let query: Query<T> = this.getCollection<T>(collectionName);

      for (const filter of filters) {
        query = query.where(filter.field, filter.operator, filter.value);
      }

      return await query.get();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to query documents in ${collectionName}: ${message}`);
    }
  }

  /**
   * Execute multiple operations in a batch for atomicity
   * @param operations Array of batch operations
   * @returns Promise<void>
   */
  async batchWrite<T extends DocumentData = DocumentData>(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      docId?: string;
      data?: T | UpdateData<T>;
    }>,
  ): Promise<void> {
    try {
      const batch = this.firestore.batch();

      for (const op of operations) {
        if (op.type === 'create') {
          const collectionRef = this.getCollection<T>(op.collection);
          const docRef = op.docId ? collectionRef.doc(op.docId) : collectionRef.doc();
          batch.set(docRef, op.data as T);
        } else if (op.type === 'update' && op.docId) {
          const docRef = this.getDocument<T>(op.collection, op.docId);
          batch.update(docRef, op.data as UpdateData<T>);
        } else if (op.type === 'delete' && op.docId) {
          const docRef = this.getDocument<T>(op.collection, op.docId);
          batch.delete(docRef);
        }
      }

      await batch.commit();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute batch write: ${message}`);
    }
  }
}

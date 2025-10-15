import { Injectable, Inject } from '@nestjs/common';
import {
  Firestore,
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
  WriteBatch,
  WhereFilterOp,
  DocumentData,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase.module';

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
  getCollection(collectionName: string): CollectionReference {
    return this.firestore.collection(collectionName);
  }

  /**
   * Get a reference to a specific document
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @returns DocumentReference
   */
  getDocument(collectionName: string, docId: string): DocumentReference {
    return this.firestore.collection(collectionName).doc(docId);
  }

  /**
   * Create a new document with optional custom ID
   * @param collectionName Name of the collection
   * @param data Document data
   * @param docId Optional custom document ID
   * @returns Promise<DocumentReference>
   */
  async createDocument(
    collectionName: string,
    data: any,
    docId?: string,
  ): Promise<DocumentReference> {
    try {
      const collection = this.getCollection(collectionName);

      if (docId) {
        const docRef = collection.doc(docId);
        await docRef.set(data);
        return docRef;
      } else {
        const docRef = await collection.add(data);
        return docRef;
      }
    } catch (error) {
      throw new Error(`Failed to create document in ${collectionName}: ${error.message}`);
    }
  }

  /**
   * Update an existing document
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @param data Update data
   * @returns Promise<void>
   */
  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      const docRef = this.getDocument(collectionName, docId);
      await docRef.update(data);
    } catch (error) {
      throw new Error(`Failed to update document ${docId} in ${collectionName}: ${error.message}`);
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
      throw new Error(
        `Failed to delete document ${docId} from ${collectionName}: ${error.message}`,
      );
    }
  }

  /**
   * Query documents with multiple filters
   * @param collectionName Name of the collection
   * @param filters Array of filter conditions
   * @returns Promise<QuerySnapshot>
   */
  async queryDocuments(
    collectionName: string,
    filters: Array<{
      field: string;
      operator: WhereFilterOp;
      value: any;
    }>,
  ): Promise<QuerySnapshot> {
    try {
      let query: any = this.getCollection(collectionName);

      for (const filter of filters) {
        query = query.where(filter.field, filter.operator, filter.value);
      }

      return await query.get();
    } catch (error) {
      throw new Error(`Failed to query documents in ${collectionName}: ${error.message}`);
    }
  }

  /**
   * Execute multiple operations in a batch for atomicity
   * @param operations Array of batch operations
   * @returns Promise<void>
   */
  async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      docId?: string;
      data?: any;
    }>,
  ): Promise<void> {
    try {
      const batch = this.firestore.batch();

      for (const op of operations) {
        if (op.type === 'create') {
          const docRef = op.docId
            ? this.getDocument(op.collection, op.docId)
            : this.getCollection(op.collection).doc();
          batch.set(docRef, op.data);
        } else if (op.type === 'update' && op.docId) {
          const docRef = this.getDocument(op.collection, op.docId);
          batch.update(docRef, op.data);
        } else if (op.type === 'delete' && op.docId) {
          const docRef = this.getDocument(op.collection, op.docId);
          batch.delete(docRef);
        }
      }

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to execute batch write: ${error.message}`);
    }
  }
}

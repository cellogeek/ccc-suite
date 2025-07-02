import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Slide, ComplianceReport } from '../types/scripture';

export interface PresentationData {
  id?: string;
  userId: string;
  title: string;
  scriptureReference: string;
  slides: Slide[];
  complianceReport: ComplianceReport;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
}

export class FirestoreService {
  private static instance: FirestoreService;
  
  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Save presentation to Firestore
  async savePresentation(presentation: Omit<PresentationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const presentationData = {
        ...presentation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'presentations'), presentationData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving presentation:', error);
      throw error;
    }
  }

  // Update existing presentation
  async updatePresentation(id: string, updates: Partial<PresentationData>): Promise<void> {
    try {
      const presentationRef = doc(db, 'presentations', id);
      await updateDoc(presentationRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating presentation:', error);
      throw error;
    }
  }

  // Get user's presentations
  async getUserPresentations(userId: string, limitCount: number = 50): Promise<PresentationData[]> {
    try {
      const q = query(
        collection(db, 'presentations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as PresentationData[];
    } catch (error) {
      console.error('Error getting user presentations:', error);
      throw error;
    }
  }

  // Get single presentation
  async getPresentation(id: string): Promise<PresentationData | null> {
    try {
      const docRef = doc(db, 'presentations', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as PresentationData;
      }
      return null;
    } catch (error) {
      console.error('Error getting presentation:', error);
      throw error;
    }
  }

  // Delete presentation
  async deletePresentation(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'presentations', id));
    } catch (error) {
      console.error('Error deleting presentation:', error);
      throw error;
    }
  }

  // Get public presentations (for sharing)
  async getPublicPresentations(limitCount: number = 20): Promise<PresentationData[]> {
    try {
      const q = query(
        collection(db, 'presentations'),
        where('isPublic', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as PresentationData[];
    } catch (error) {
      console.error('Error getting public presentations:', error);
      throw error;
    }
  }

  // Search presentations by scripture reference
  async searchPresentations(userId: string, searchTerm: string): Promise<PresentationData[]> {
    try {
      const q = query(
        collection(db, 'presentations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const presentations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as PresentationData[];

      // Filter by search term (client-side for now)
      return presentations.filter(p => 
        p.scriptureReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching presentations:', error);
      throw error;
    }
  }
}

export const firestoreService = FirestoreService.getInstance();
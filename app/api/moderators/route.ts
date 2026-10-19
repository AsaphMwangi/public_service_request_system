import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'moderators'))
    let moderators: any[] = []
    
    querySnapshot.forEach((doc) => {
      moderators.push({ _id: doc.id, ...doc.data() })
    })
    
    return NextResponse.json({ success: true, data: moderators }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.requesterEmail !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'Unauthorized action' }, { status: 403 })
    }

    // New logic: Check if the email exists in the users collection
    const usersRef = collection(db, 'users')
    const userQuery = query(usersRef, where('email', '==', body.email))
    const userSnapshot = await getDocs(userQuery)

    if (userSnapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot add moderator. This email has not registered a normal user account yet.' 
      }, { status: 404 })
    }

    // Add them to moderators if they exist
    const docRef = await addDoc(collection(db, 'moderators'), {
      email: body.email,
      createdAt: Date.now()
    })
    
    return NextResponse.json({ success: true, data: { _id: docRef.id, email: body.email } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const requesterEmail = searchParams.get('requesterEmail')
    
    if (requesterEmail !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'Unauthorized action' }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
    }
    
    await deleteDoc(doc(db, 'moderators', id))
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
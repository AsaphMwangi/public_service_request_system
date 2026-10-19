import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRequest extends Document {
  userId: string
  userEmail: string
  category: string
  location: string
  description: string
  imageUrl?: string
  status: 'Pending' | 'In Progress' | 'Resolved'
  createdAt: Date
}

const RequestSchema: Schema<IRequest> = new Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: false },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
})

const RequestModel: Model<IRequest> = mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema)

export default RequestModel
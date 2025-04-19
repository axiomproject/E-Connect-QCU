// lib/ is for code that the frontend and backend should both have access to. It
// might be large classes, or just types.
//
// It can be imported from backend/* or src/* files like this:
//
// import { Todo } from 'lib'
//

export type Todo = {
  userId: number
  id: number
  title: string
  completed: boolean
}

// Add a User type for consistent use across frontend and backend
export type User = {
  id: number
  username: string
  email: string
  isAdmin?: boolean
  avatar?: string
  is_verified?: boolean
}

// Add the EmailOptions type from the emailService
export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

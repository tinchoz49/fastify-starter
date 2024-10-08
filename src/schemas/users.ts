import { Type } from '@sinclair/typebox'

export const UserSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid', description: 'Unique identifier for the user' }),
    username: Type.String({ description: 'Username of the user' }),
    email: Type.String({ format: 'email', description: 'Email of the user' }),
  },
  {
    $id: 'User',
    title: 'User',
    description: 'User schema',
  }
)

export const SignupSchema = Type.Object({
  username: Type.String({ minLength: 3, maxLength: 50, description: 'Username for the new user' }),
  email: Type.String({ format: 'email', description: 'Email address of the new user' }),
  password: Type.String({
    format: 'password',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    minLength: 8,
    description: 'Password of the user. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  }),
}, {
  $id: 'SignupSchema',
  title: 'SignupSchema',
  description: 'Schema for user signup',
})

export const LoginSchema = Type.Object({
  email: Type.String({ format: 'email', description: 'Email address of the user' }),
  password: Type.String({
    format: 'password',
    minLength: 8,
    description: 'Password of the user.',
  }),
}, {
  $id: 'LoginSchema',
  title: 'LoginSchema',
  description: 'Schema for user login',
})

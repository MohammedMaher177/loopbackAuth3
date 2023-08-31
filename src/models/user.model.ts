import {Entity, model, property} from '@loopback/repository';
import jwt from "jsonwebtoken";
@model({settings: {strict: false}})
export class User extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    id: true,
    generated: false,
  })
  _id?: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<User>) {
    super(data);
  }

  generateToken() {
    const token = jwt.sign({id: this._id, email: this.email}, "loopback")
    return token
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

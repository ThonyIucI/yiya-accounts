import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

export class ErrorManager extends Error {
  constructor({
    type,
    message,
  }: {
    type: keyof typeof HttpStatus;
    message: string;
  }) {
    super(`${type} :: ${message}`);
  }

  public static createSignatureError(error: any) {
    // const { response } = error;

    const { message } = error;
    const name: string = message.split(' :: ')[0];
    const errorMessage = message.split(' :: ')[1];
    console.log(error.message, '---', error);

    if (error instanceof EntityNotFoundError) {
      throw new NotFoundException(`No se pudo encontrar el elemento`);
    }
    //  else if (name) {
    //   throw new HttpException(name, HttpStatus[name]);
    // }
    else {
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR, {
        cause: error,
      });
    }
  }
}

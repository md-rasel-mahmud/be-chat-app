import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException({
        error: 'Validation failed',
        statusCode: HttpStatus.BAD_REQUEST,
        data: errors.map((field) => {
          return {
            field: field.property,
            in: 'body',
            message: Object.values(field.constraints).reduce(
              (acc, curr, index) => {
                acc = index === 0 ? curr : acc + ', ' + curr;
                return acc;
              },
              '',
            ),
          };
        }),
      });
    }
    return value;
  }

  private toValidate(metatype: new (...args: any[]) => any): boolean {
    const types: (new (...args: any[]) => any)[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }
}

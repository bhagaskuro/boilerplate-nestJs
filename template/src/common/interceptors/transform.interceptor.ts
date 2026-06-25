import { ApiResponseDto } from '@common/dto/api-response.dto';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  Injectable,
  HttpStatus,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data is already in ApiResponseDto format, return as is
        if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data) {
          return data;
        }

        // Default success message based on HTTP method
        let message = 'Operation successful';

        switch (request.method) {
          case 'POST':
            message = 'Resource created successfully';
            response.status(HttpStatus.CREATED);
            break;
          case 'PUT':
          case 'PATCH':
            message = 'Resource updated successfully';
            break;
          case 'DELETE':
            message = 'Resource deleted successfully';
            break;
          case 'GET':
            message = 'Data retrieved successfully';
            break;
        }

        return {
          statusCode: response.statusCode || HttpStatus.OK,
          message,
          data,
        };
      }),
    );
  }
}

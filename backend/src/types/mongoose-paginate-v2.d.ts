/**
 * Mongoose Paginate V2 类型声明
 */

import { Document, Model, Schema } from 'mongoose';

declare module 'mongoose' {
  interface PaginateOptions {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1> | string;
    select?: Record<string, number> | string;
    populate?: string | object | Array<string | object>;
    lean?: boolean;
    leanWithId?: boolean;
    offset?: number;
    customLabels?: Record<string, string>;
    pagination?: boolean;
    useEstimatedCount?: boolean;
    useCustomCountFn?: () => Promise<number>;
    forceCountFn?: boolean;
  }

  interface PaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number | null;
    nextPage?: number | null;
    [customLabel: string]: T[] | number | boolean | null | undefined;
  }

  interface PaginateModel<T extends Document> extends Model<T> {
    paginate(
      query?: object,
      options?: PaginateOptions,
      callback?: (err: any, result: PaginateResult<T>) => void
    ): Promise<PaginateResult<T>>;
  }

  function model<T extends Document>(
    name: string,
    schema?: Schema<T>,
    collection?: string,
    skipInit?: boolean
  ): PaginateModel<T>;
}

declare module 'mongoose-paginate-v2' {
  import { Schema } from 'mongoose';
  
  function mongoosePaginate(schema: Schema): void;
  
  namespace mongoosePaginate {
    const paginate: {
      options: {
        lean?: boolean;
        leanWithId?: boolean;
        limit?: number;
        customLabels?: Record<string, string>;
      };
    };
  }
  
  export = mongoosePaginate;
}


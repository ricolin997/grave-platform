import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * 根據產品類型進行條件驗證
 * @param property 用於判斷產品類型的屬性名稱
 * @param validationOptions 驗證選項
 * @returns 裝飾器
 */
export function IsRequiredForTombProduct(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredForTombProduct',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object as any;
          const productType = object.productType;
          
          // 檢查是否是墓塔產品類型
          const isTombProduct = ['單人塔位', '雙人塔位', '家族塔位', 'VIP塔位', '其他'].includes(productType);
          
          // 如果是墓塔產品，則該字段必須有值
          if (isTombProduct) {
            return value !== undefined && value !== null && value !== '';
          }
          
          // 如果是生前契約，則不需要驗證這個字段
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 對塔位商品而言是必填的`;
        },
      },
    });
  };
} 
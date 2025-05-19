import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message, MessageSchema } from './entities/message.entity';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { MessagesGateway } from './messages.gateway';
import { ModuleRef } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
    ]),
    ProductsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway
  ],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    const messagesService = this.moduleRef.get(MessagesService);
    const messagesGateway = this.moduleRef.get(MessagesGateway);

    // 建立雙向關係
    messagesService.setMessagesGateway(messagesGateway);
    messagesGateway.setMessagesService(messagesService);
  }
}

import { Module } from '@nestjs/common';
import { CombosService } from './combos.service';
import { CombosController } from './combos.controller';

@Module({
  controllers: [CombosController],
  providers: [CombosService]
})
export class CombosModule {}

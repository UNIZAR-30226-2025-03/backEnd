import { Controller } from '@nestjs/common';
import { ColaReproduccionService } from './cola-reproduccion.service';

@Controller('cola-reproduccion')
export class ColaReproduccionController {
    constructor(private readonly colaReproduccionService: ColaReproduccionService) {}
    
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }

  @Public()
  @Get('ping')
  @ApiOperation({ summary: 'Ping endpoint' })
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}

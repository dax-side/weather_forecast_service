import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(morgan('combined'));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Weather Forecast API')
    .setDescription(
      'A comprehensive weather forecast service that provides current weather and forecasts for cities worldwide',
    )
    .setVersion('1.0')
    .addTag('Weather API', 'Weather data endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(
    `🌤️  Weather Forecast Service running on: http://localhost:${port}`,
  );
  console.log(
    `📊 API Documentation available at: http://localhost:${port}/api/docs`,
  );
  console.log(
    `🔗 API endpoints available at: http://localhost:${port}/api/weather/current?city=London`,
  );
  console.log(`🌐 Dashboard available at: http://localhost:${port}`);
}

void bootstrap();

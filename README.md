# Weather Forecast Service

A comprehensive NestJS-based weather forecast API that provides current weather data and forecasts for cities worldwide using the OpenWeatherMap API.

## Features

- Real-time current weather data
- 5-day weather forecasts with 3-hour intervals
- City search tracking and statistics
- Scheduled background data refresh
- SQLite database with TypeORM
- Comprehensive API documentation with Swagger
- Input validation and error handling
- CORS enabled for cross-origin requests

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: SQLite with TypeORM
- **External API**: OpenWeatherMap API
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Scheduling**: @nestjs/schedule
- **HTTP Client**: Axios

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenWeatherMap API key

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd weather_forecast_service
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
PORT=3000
```

4. Build the application
```bash
npm run build
```

5. Start the application
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Weather Endpoints

- `GET /api/weather/current?city={cityName}` - Get current weather for a city
- `GET /api/weather/forecast?city={cityName}` - Get 5-day weather forecast
- `GET /api/weather/history` - Get search history
- `GET /api/weather/cities` - Get all tracked cities

### Dashboard Endpoints

- `GET /` - Main dashboard page
- `POST /search` - Search functionality

## API Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/docs
```

## Database Schema

The application uses four main entities:

### CityEntity
- Stores city information with coordinates
- Tracks search statistics
- Primary reference for weather data

### WeatherEntity  
- Current weather data for cities
- Linked to CityEntity via foreign key
- Automatically updated on API calls

### ForecastEntity
- Weather forecast data points
- 3-hour interval forecasts up to 5 days
- Linked to CityEntity

### SearchHistoryEntity
- Tracks search patterns
- Records search frequency and timestamps

## Caching Strategy

- **Current Weather**: Cached for 15 minutes
- **Forecast Data**: Cached for 1 hour
- **Background Refresh**: Scheduled hourly updates for popular cities

## Error Handling

The API provides comprehensive error responses:

- `200 OK` - Success
- `400 Bad Request` - Invalid input or API key issues  
- `404 Not Found` - City not found
- `500 Internal Server Error` - Server errors

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── controllers/         # API controllers
├── services/           # Business logic services
├── entities/           # Database entities
├── dto/               # Data transfer objects
├── app.module.ts      # Main application module
└── main.ts           # Application entry point
```

## Configuration

### Environment Variables

- `OPENWEATHER_API_KEY` - Required: Your OpenWeatherMap API key
- `PORT` - Optional: Server port (default: 3000)

### Database

The application uses SQLite by default. The database file is automatically created as `weather.db` in the project root.

## Performance Considerations

- Database queries are optimized to prevent N+1 query problems
- API responses are cached to reduce external API calls
- Background tasks refresh popular city data proactively
- Proper indexing on frequently queried fields

## Security

- Input validation on all endpoints
- Environment variable protection for API keys
- CORS configuration for secure cross-origin access
- Error messages sanitized to prevent information leakage

## Monitoring and Logging

- Morgan middleware for HTTP request logging
- Structured logging for debugging and monitoring
- Error tracking with detailed stack traces in development

## License

This project is licensed under the MIT License.

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

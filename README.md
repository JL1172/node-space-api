# Node Space API

# Restful API Read Me

This restful API is a rewritten and optimized version of the original API for Node space. It functions as a full authentication API with no third-party integration. Security implementations include JWTs, rate limiting, sanitation, validation, and eventual IP blacklisting. The API handles safe image processing, web sockets, authentication, and content posting.

### Project Direction
The direction of Node space is uncertain, aiming to offer something different without reinventing the wheel with blogs. This project adopts a hybrid approach of Test-Driven Development (TDD) for scalability and multi-user support. Future plans involve integrating microservices, potentially with Spring Boot, and implementing automatic tests with Git pre-commit hooks using Jest and Node's child process module for diff scanning.

### Testing
Unit tests have already been developed using Jest and SuperTest.
Integration testing will be implemented along with e2e tests with jest and cypress.

### Tech Stack
- **MVC Framework:** Nest JS
- **ORM:** Prisma
- **Database:** Postgres
- **Language:** TypeScript with Java-esque code design
- **Hosting:** Elephant Sequel for database, Render for API
- **Database Interaction:** Prisma Client

### Design Principles
The design principles heavily focus on object-oriented programming, emphasizing encapsulation, abstraction, dependency injection, and simple testability. Standardized error handling and optimized code flow contribute to improved maintainability and readability.

### Project Goals
> [!IMPORTANT]
> I am really wanting to make this an extremely difficult project in order to learn, so please reach out if you have any suggestions.
> The goal is to create a production-grade multi-user application with robust security and high performance. This project serves as a learning opportunity and aims to push the developer's skills forward.

### Modules: 
1. [authentication module](/src/0-authentication-module/README.md)
2. [accounting module](/src/0-accounting-module/README.md)
3. [customer module](/src/0-customer-module/README.md)
4. [project module](/src/0-project-module/README.md)
5. [time watch module](/src/0-time-watch-module/README.md)
6. [invoice module](/src/0-invoice-module/README.md)
7. [Supplier Module](/src/0-supplier-module/README.md)
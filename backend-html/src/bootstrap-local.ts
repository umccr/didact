import { app } from './app-concrete';
import { setupTestData } from './testing/setup-test-data';

// the development node bootstrap entrypoint
// this entrypoint can be used both when run directly locally OR
// as the entrypoint for running the complete Docker website locally

setupTestData(true).then(() => {
  // IT IS NOT THE ENTRYPOINT FOR USE IN PRODUCTION WITHIN THE AWS LAMBDA ENVIRONMENT
  app.listen(3000);
});

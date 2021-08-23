import wellKnownApp from './app-concrete';

// the development node bootstrap entrypoint
// this entrypoint can be used both when run directly locally OR
// as the entrypoint for running the complete Docker website locally
wellKnownApp.listen(3001);

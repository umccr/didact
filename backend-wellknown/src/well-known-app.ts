import express, { Router } from "express";
import { URLSearchParams } from "url";
import { wellKnownRouter } from "./well-known-router";

export class WellKnownApp {
  public app: express.Application;
  public env: string;

  constructor() {
    this.app = express();
    this.env = process.env.NODE_ENV || "development";

    this.app.set("query parser", (queryString) => {
      return new URLSearchParams(queryString);
    });

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use("/.well-known", wellKnownRouter);
  }

  public listen(port: number) {
    this.app.listen(port, () => {
      console.log(`🚀 Well Known App listening on the port ${port}`);
    });
  }

  public getServer() {
    return this.app;
  }
}

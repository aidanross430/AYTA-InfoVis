import { createBrowserRouter } from "react-router";
import { TitlePage } from "./components/TitlePage";
import { GamePage } from "./components/GamePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: TitlePage,
  },
  {
    path: "/game",
    Component: GamePage,
  },
]);

import { type RenderResult, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

export function setupFormTest(jsx: ReactElement): {
  user: ReturnType<typeof userEvent.setup>;
  screen: typeof screen;
} & RenderResult {
  return {
    user: userEvent.setup(),
    ...render(jsx),
    screen,
  };
}

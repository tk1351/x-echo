import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

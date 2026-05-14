import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders product title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "MBTI 对话翻译器" })).toBeInTheDocument();
});

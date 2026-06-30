"use client";

import { useState, useCallback } from "react";

type ButtonType = "number" | "operator" | "clear" | "equals";

const BUTTONS: { value: string; type: ButtonType; span?: boolean }[] = [
  { value: "C", type: "clear" },
  { value: "±", type: "operator" },
  { value: "%", type: "operator" },
  { value: "÷", type: "operator" },
  { value: "7", type: "number" },
  { value: "8", type: "number" },
  { value: "9", type: "number" },
  { value: "×", type: "operator" },
  { value: "4", type: "number" },
  { value: "5", type: "number" },
  { value: "6", type: "number" },
  { value: "−", type: "operator" },
  { value: "1", type: "number" },
  { value: "2", type: "number" },
  { value: "3", type: "number" },
  { value: "+", type: "operator" },
  { value: "0", type: "number", span: true },
  { value: ".", type: "number" },
  { value: "=", type: "equals" },
];

function calculate(a: number, b: number, op: string): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? 0 : a / b;
    case "%":
      return b === 0 ? 0 : a % b;
    default:
      return b;
  }
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (waitingForOperand) return digit;
        if (digit === "." && prev.includes(".")) return prev;
        if (digit === "." && prev === "0") return "0.";
        if (digit === "0" && prev === "0") return prev;
        if (digit !== "." && prev === "0") return digit;
        return prev + digit;
      });
      setWaitingForOperand(false);
    },
    [waitingForOperand]
  );

  const performOperation = useCallback(
    (nextOperator: string) => {
      const inputValue = parseFloat(display);
      if (previousValue === null) {
        setPreviousValue(inputValue);
      } else if (operator) {
        const result = calculate(previousValue, inputValue, operator);
        setDisplay(String(result));
        setPreviousValue(result);
      }
      setWaitingForOperand(true);
      setOperator(nextOperator);
    },
    [display, previousValue, operator]
  );

  const handleClick = useCallback(
    (value: string, type: ButtonType) => {
      switch (type) {
        case "number":
          inputDigit(value);
          break;
        case "operator":
          if (value === "±") {
            setDisplay((prev) => String(-parseFloat(prev)));
          } else if (value === "%") {
            setDisplay((prev) => String(parseFloat(prev) / 100));
          } else {
            performOperation(value);
          }
          break;
        case "clear":
          setDisplay("0");
          setPreviousValue(null);
          setOperator(null);
          setWaitingForOperand(false);
          break;
        case "equals":
          if (operator && previousValue !== null) {
            const result = calculate(previousValue, parseFloat(display), operator);
            setDisplay(String(result));
            setPreviousValue(null);
            setOperator(null);
          }
          setWaitingForOperand(true);
          break;
      }
    },
    [inputDigit, performOperation, operator, previousValue, display]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Display */}
      <div className="rounded-lg bg-zinc-100 px-3 py-4 text-right font-mono text-2xl font-medium text-zinc-800">
        {display}
      </div>

      {/* Buttons grid */}
      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.map(({ value, type, span }) => {
          const isOperator = type === "operator" && value !== "±" && value !== "%";
          const isEquals = type === "equals";
          const isClear = type === "clear";
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value, type)}
              className={`flex h-12 items-center justify-center rounded-lg font-medium transition-colors active:scale-95 ${
                span ? "col-span-2" : ""
              } ${
                isEquals
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : isOperator
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : isClear
                      ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

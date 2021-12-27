import { RestoreTableToPointInTimeCommand } from "@aws-sdk/client-dynamodb";

export function Spinner() {
  const inlineStyle = `
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  return (
    <>
      <style>
        {inlineStyle}
      </style>
      <div className="spinner" style={getSpinnerStyle()}></div>
    </>
  );
}

function getSpinnerStyle() {
  return {
    display: "inline-block",
    width: "36px",
    height: "36px",
    borderRadius: "100%",
    borderTop: "4px solid var(--color-brand-light)",
    borderRight: "4px solid var(--color-brand-light)",
    borderBottom: "4px solid var(--color-brand-light)",
    borderLeft: "4px solid var(--color-brand-dark)",
    animation: "spin 0.6s infinite ease-in-out",
  };
}

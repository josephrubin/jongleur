import { NavLink } from "remix";
import { makePracticeUrl } from "~/modules/practices";

/** The subset of Practice fields we need to make the timeline. */
export interface PracticeSubset {
  readonly id: string;
  readonly uploadEpoch: number;
  readonly piece: { readonly id: string };
}

interface TimelineProps {
  readonly practices: PracticeSubset[];
}

export function Timeline(props: TimelineProps) {
  const practices = props.practices;

  const {
    containerStyle,
    listStyle,
    linkStyle,
    itemStyle,
    selectedItemStyle,
    dotStyle,
    tooltipStyle,
    leftArrowStyle,
    rightArrowStyle,
  } = getStyles(practices);

  return (
    <div style={containerStyle}>
      <ol style={listStyle}>
        <li key="left-arrow" style={leftArrowStyle}></li>
        {practices.map((practice) =>
          <li
            key={practice.id}
            className="brand-hover"
            style={itemStyle}
          >
            <NavLink to={makePracticeUrl(practice)} style={linkStyle}>
              <div style={dotStyle}></div>
              <div style={tooltipStyle}>
                {new Date(Number(practice.uploadEpoch)).toDateString()}
              </div>
            </NavLink>
          </li>
        )}
        <li key="right-arrow" style={rightArrowStyle}></li>
      </ol>
    </div>
  );
}

function getStyles(practices: PracticeSubset[]) {
  return {
    containerStyle: {
      position: "relative",
      height: "64px",
    },
    listStyle: {
      display: "grid",
      listStyle: "none",
      gap: "12px",
      padding: "0",
      marginLeft: "2px",
      marginRight: "2px",
      borderTop: "2px solid black",
      width: `max(99%, ${String(146 * practices.length)}px)`,
      gridTemplateColumns: `1fr ${"2fr ".repeat(practices.length)} 1fr`,
    },
    linkStyle: {
      display: "block",
      width: "100%",
      height: "100%",
    },
    itemStyle: {
      display: "block",
      width: "128px",
      height: "54px",
      placeSelf: "center",
      marginTop: "-16px",
      cursor: "pointer",
      position: "relative",
      borderRadius: "6px",
      paddingTop: "6px",
    },
    selectedItemStyle: {
      backgroundColor: "var(--color-brand)",
    },
    dotStyle: {
      height: "18px",
      width: "18px",
      marginLeft: "55px",
      backgroundColor: "white",
      border: "2px solid black",
      borderRadius: "50%",
      textAlign: "center",
    },
    tooltipStyle: {
      position: "absolute",
      top: "24px",
      width: "128px",
      textAlign: "center",
    },
    leftArrowStyle: {
      display: "inline-block",
      placeSelf: "start",
      height: "14px",
      width: "14px",
      marginLeft: "2px",
      borderLeft: "2px solid black",
      borderTop: "2px solid black",
      transform: "translateY(-8px) rotate(-45deg)",
    },
    rightArrowStyle: {
      display: "inline-block",
      placeSelf: "end",
      height: "14px",
      width: "14px",
      marginRight: "2px",
      borderLeft: "2px solid black",
      borderTop: "2px solid black",
      transform: "translateY(-32px) rotate(135deg)",
    },
  };
}

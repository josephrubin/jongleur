interface TimelineProps {
  readonly selectedNodeIndex: number;
}

export function Timeline(props: TimelineProps) {
  const practices = [
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
    {date: "Jun 1, 2021"},
  ];

  const {
    containerStyle,
    listStyle,
    itemStyle,
    selectedItemStyle,
    dotStyle,
    tooltipStyle,
    leftArrowStyle,
    rightArrowStyle,
  } = getStyles(practices);

  console.log("Sel", props.selectedNodeIndex);

  return (
    <div style={containerStyle}>
      <ol style={listStyle}>
        <li style={leftArrowStyle}></li>
        {practices.map((practice, index) =>
          <>
            <li
              key={practice.id}
              style={{
                ...itemStyle, ...(index === props.selectedNodeIndex ? selectedItemStyle : {}),
              }}
              className="brand-hover"
            >
              <div style={dotStyle}></div>
              <div style={tooltipStyle}>
                {practice.date}
              </div>
            </li>
          </>
        )}
        <li style={rightArrowStyle}></li>
      </ol>
    </div>
  );
}

function getStyles(practices: Practice[]) {
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
      backgroundColor: "var(--color-brand-light)",
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

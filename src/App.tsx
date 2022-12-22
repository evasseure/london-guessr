import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./App.module.css";
import mapData from "./data/data.json";
import { MAP_COLORS } from "./colors";
import { Answer, Feature, Question } from "./types";

const ALLOWED_TRIES = 3;

export function App() {
  const mapRef = useRef(null);
  const mapZoneRed = useRef(null);

  const [questions, setQuestions] = useState<Question[]>(
    d3.shuffle(
      mapData.features
        .filter((f) => !f.properties.ignore)
        .map((f) => ({ id: f.properties.id, name: f.properties.name }))
    )
  );
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [triesCounter, setTriesCounter] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);

  const jumpToNextQuestion = () => {
    const newArray = questions.slice(1);
    setQuestions(newArray);
    setTriesCounter(0);
  };

  const checkAnswer = (id: number, name: string) => {
    if (questions.length === 0) return;

    if (id === questions[0].id || triesCounter + 1 >= ALLOWED_TRIES) {
      const status = (() => {
        switch (triesCounter + 1) {
          case 1:
            return "CORRECT";
          case ALLOWED_TRIES:
            return "FAILED";
          default:
            return "MEH";
        }
      })();

      setAnswers((answers) => [{ ...questions[0], status: status }, ...answers]);
      jumpToNextQuestion();
    } else {
      setTriesCounter((tries) => tries + 1);
    }
  };

  const getZoneStatus = (zoneId: number) => {
    const result = answers.find((a) => a.id === zoneId);
    if (result) return result.status;
    return "AWAITING";
  };

  const showAwserHint = (hint: string, x: number, y: number) => {
    const svgElement = d3.select(mapRef.current);

    const container = svgElement
      .append("foreignObject")
      .attr("x", x)
      .attr("y", y - 30)
      .attr("width", "100%")
      .attr("height", 500)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const label = container.append("xhtml:div").attr("class", "hint-label").html(`<span>${hint}</span>`);

    // Forcing non null, since there is not reason it could be null.
    const boundingRect = (label!.node()! as Element).getBoundingClientRect();
    container.attr("x", x - boundingRect.width / 2);
    container.attr("width", boundingRect.width);
    container
      .transition()
      .duration(500)
      .style("opacity", 1)
      .transition()
      .duration(1200)
      .attr("y", y - 40)
      .style("opacity", 0)
      .remove();
  };

  // TODO Don't redraw the whole svg at every render
  useEffect(() => {
    let projection = d3.geoNaturalEarth1();
    if (mapZoneRed.current) {
      const mapContainer = mapZoneRed.current as HTMLDivElement;
      const boundingBox = mapContainer.getBoundingClientRect();

      // 64 to compensate for the css padding.
      // Casting to any because the json is not exactly as fitSize expect.
      projection.fitSize([boundingBox.width - 64, boundingBox.height], mapData as any);
    }

    let geoGenerator = d3.geoPath().projection(projection);
    const svgElement = d3.select(mapRef.current);
    svgElement
      .selectAll("path")
      .data(mapData.features)
      .join("path")
      // Casting to any because D3 typings are weird
      .attr("d", geoGenerator as any)
      .style("fill", (d) => {
        if (d.properties.ignore) return MAP_COLORS.IGNORED.fill;
        return MAP_COLORS[getZoneStatus(d.properties.id)].fill;
      })
      .style("stroke", (d) => {
        if (d.properties.ignore) return MAP_COLORS.IGNORED.stroke;
        return MAP_COLORS[getZoneStatus(d.properties.id)].stroke;
      });

    svgElement
      .selectAll("path")
      .on("mouseover", function (e, d) {
        const feature = d as Feature;
        if (!feature.properties.ignore && getZoneStatus(feature.properties.id) === "AWAITING")
          d3.select(this).style("fill", MAP_COLORS.HOVER.fill);
      })
      .on("mouseout", function (e, d) {
        const feature = d as Feature;
        if (!feature.properties.ignore && getZoneStatus(feature.properties.id) === "AWAITING")
          d3.select(this).style("fill", MAP_COLORS.AWAITING.fill);
      })
      .on("click", function (e, d) {
        const feature = d as Feature;
        showAwserHint(feature.properties.name, e.offsetX, e.offsetY);
        if (!feature.properties.ignore && getZoneStatus(feature.properties.id) === "AWAITING")
          checkAnswer(feature.properties.id, feature.properties.name);
      });
  });

  useEffect(() => {
    const interval = setInterval(() => setTimer(timer + 1), 1000);

    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div className={styles.app}>
      <div className={styles.sideBar}>
        <h1 className={styles.title}>LondonGuessr</h1>
        <div className={styles.questions}>
          {questions.length > 0 && (
            <>
              <div className={styles.questionLabel}>Where is :</div>
              <div className={styles.question}>{questions[0].name}</div>
            </>
          )}
          {answers.map((answer) => (
            <div
              key={"answer-" + answer.id}
              className={styles.answer}
              style={{
                color: MAP_COLORS[answer.status].stroke,
                backgroundColor: MAP_COLORS[answer.status].fill,
              }}>
              {answer.name}
            </div>
          ))}
        </div>
        <div className={styles.answersData}>
          <div>✅ {answers.filter((a) => a.status === "CORRECT").length}</div>
          <div>⚠️ {answers.filter((a) => a.status === "MEH").length}</div>
          <div>❌ {answers.filter((a) => a.status === "FAILED").length}</div>
        </div>
      </div>
      <div className={styles.mapContainer} ref={mapZoneRed}>
        <div className={styles.statsBar}>
          <div>
            <span className={styles.clock}>🕒</span>
            {[Math.floor(timer / 60), timer % 60 < 10 ? "0" + (timer % 60) : timer % 60].join(":")}
          </div>
          <div className={styles.lives}>
            {[...Array(triesCounter).keys()].map((i) => (
              <span key={"bheart-" + i}>🖤</span>
            ))}
            {[...Array(ALLOWED_TRIES - triesCounter).keys()].map((i) => (
              <span key={"rheart-" + i}>❤️</span>
            ))}
          </div>
        </div>
        <svg width="100%" height="100%" ref={mapRef}></svg>
      </div>
    </div>
  );
}

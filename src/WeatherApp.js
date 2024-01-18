import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";

import { ReactComponent as CloudyIcon } from "./images/cloudy.svg";
import { ReactComponent as AirFlowIcon } from "./images/air-Flow.svg";
import { ReactComponent as RainIcon } from "./images/rain.svg";
import { ReactComponent as RedoIcon } from "./images/redo.svg";

const Cloudy = styled(CloudyIcon)`
  flex-basis: 30px;
`;

const Redo = styled.div`
  position: absolute;
  right: 15px;
  bottom: 15px;
  font-size: 12px;
  display: inline-flex;
  align-items: flex-end;
  color: #828282;

  svg {
    margin-left: 10px;
    width: 15px;
    height: 15px;
    cursor: pointer;
  }
`;

const Container = styled.div`
  background-color: #ededed;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WeatherCard = styled.div`
  position: relative;
  min-width: 360px;
  box-shadow: 0 1px 3px 0 #999999;
  background-color: #f9f9f9;
  box-sizing: border-box;
  padding: 30px 15px;
`;

const Location = styled.div`
  font-size: 28px;
  color: ${(props) => (props.theme === "dark" ? "#dadada" : "#212121")};
  margin-bottom: 20px;
`;

const Description = styled.div`
  font-size: 16px;
  color: #828282;
  margin-bottom: 30px;
`;

const CurrentWeather = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Temperature = styled.div`
  color: #757575;
  font-size: 96px;
  font-weight: 300;
  display: flex;
`;

const Celsius = styled.div`
  font-weight: normal;
  font-size: 42px;
`;

const AirFlow = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: #828282;
  margin-bottom: 20px;
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Rain = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 300;
  color: #828282;
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const WeatherApp = () => {
  console.log("---invoke function component---");
  const [weatherElement, setWeatherElement] = useState({
    observationTime: new Date(),
    stationName: "",
    description: "",
    temperature: 0,
    windSpeed: 0,
    humid: 0,
    weatherCode: 0,
    rainPossibility: 0,
    comfortability: "",
  });

  const fetchCurrentWeather = () => {
    return fetch(
      "https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWA-0179E027-7E79-4DBA-BCF1-1B91C0BF4A7E&format=JSON&StationName=臺北"
    )
      .then((response) => response.json())
      .then((data) => {
        const stationData = data.records.Station[0];
        const weatherContent = stationData.WeatherElement;

        return {
          observationTime: stationData.ObsTime.DateTime,
          stationName: stationData.StationName,
          description: weatherContent.Weather,
          temperature: weatherContent.AirTemperature,
          windSpeed: weatherContent.WindSpeed,
          humid: weatherContent.RelativeHumidity,
        };
      });
  };

  useEffect(() => {
    console.log("execute function in useEffect.");
    const fetchData = async () => {
      const [currentWeather, weatherForecast] = await Promise.all([
        fetchCurrentWeather(),
        fetchWeatherForecast(),
      ]);
      setWeatherElement({
        ...currentWeather,
        ...weatherForecast,
      });
    };
    fetchData();
  }, []);

  const fetchWeatherForecast = () => {
    return fetch(
      "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWA-0179E027-7E79-4DBA-BCF1-1B91C0BF4A7E&format=JSON&StationName=臺北市"
    )
      .then((response) => response.json())
      .then((data) => {
        const stationData = data.records.location[0];

        const weatherContent = stationData.weatherElement.reduce(
          (neededElements, item) => {
            if (
              ["Wx", "PoP", "CI"].includes(item.elementName) &&
              item.time.length > 0
            ) {
              neededElements[item.elementName] =
                item.time[0].parameter.parameterName;
            }
            return neededElements;
          },
          {}
        );

        return {
          description: weatherContent.Wx,
          weatherCode: weatherContent.Wx,
          rainPossibility: weatherContent.PoP,
          comfortability: weatherContent.CI,
        };
      });
  };

  return (
    <Container>
      {console.log("render")}
      <WeatherCard>
        <Location>{weatherElement.stationName}</Location>
        <Description>
          {weatherElement.description}
          {weatherElement.comfortability}
        </Description>
        <CurrentWeather>
          <Temperature>
            {Math.round(weatherElement.temperature)} <Celsius>°C</Celsius>
          </Temperature>
          <Cloudy />
        </CurrentWeather>
        <AirFlow>
          <AirFlowIcon />
          {weatherElement.windSpeed} m/h
        </AirFlow>
        <Rain>
          <RainIcon />
          {weatherElement.rainPossibility}%
        </Rain>

        <Redo
          onClick={() => {
            fetchCurrentWeather();
            fetchWeatherForecast();
          }}
        >
          最後觀測時間:
          {new Intl.DateTimeFormat("zh-TW", {
            hour: "numeric",
            minute: "numeric",
          }).format(new Date(weatherElement.observationTime))}{" "}
          <RedoIcon />
        </Redo>
      </WeatherCard>
    </Container>
  );
};

export default WeatherApp;

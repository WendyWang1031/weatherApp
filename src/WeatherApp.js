import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import WeatherIcon from "./WeatherIcon.js";
import sunriseAndSunsetData from "./sunrise-sunset.json";
import { ReactComponent as CloudyIcon } from "./images/cloudy.svg";
import { ReactComponent as AirFlowIcon } from "./images/air-Flow.svg";
import { ReactComponent as RainIcon } from "./images/rain.svg";
import { ReactComponent as RedoIcon } from "./images/redo.svg";
import { ReactComponent as LoadingIcon } from "./images/loading.svg";
import { ThemeProvider } from "@emotion/react";

const theme = {
  Light: {
    backgroundColor: "#ededed",
    foregroundColor: "#f9f9f9",
    boxShadow: "0 1px 3px 0 #999999",
    titleColor: "#212121",
    temperatureColor: "#757575",
    textColor: "#828282",
  },
  dark: {
    backgroundColor: "#1F2022",
    foregroundColor: "#121416",
    boxShadow:
      "0 1px 4px 0 rgba(12, 12, 13, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.15)",
    titleColor: "#f9f9fa",
    temperatureColor: "#dddddd",
    textColor: "#cccccc",
  },
};

const Cloudy = styled(CloudyIcon)`
  flex-basis: 30px;
`;

const Refresh = styled.div`
  position: absolute;
  right: 15px;
  bottom: 15px;
  font-size: 12px;
  display: inline-flex;
  align-items: flex-end;
  color: ${({ theme }) => theme.textColor};

  svg {
    margin-left: 10px;
    width: 15px;
    height: 15px;
    cursor: pointer;
    animation: rotate infinite 1.5s linear;
    animation-duration: ${({ isLoading }) => (isLoading ? "1.5s" : "0s")};
  }
  @keyframes rotate {
    from {
      transform: rotate(360deg);
    }
    to {
      transform: rotate(0deg);
    }
  }
`;

const Container = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WeatherCard = styled.div`
  position: relative;
  min-width: 360px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  background-color: ${({ theme }) => theme.foregroundColor};
  box-sizing: border-box;
  padding: 30px 15px;
`;

const Location = styled.div`
  font-size: 28px;
  color: ${({ theme }) => theme.titleColor};
  margin-bottom: 20px;
`;

const Description = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 30px;
`;

const CurrentWeather = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Temperature = styled.div`
  color: ${({ theme }) => theme.temperatureColor};
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
  color: ${({ theme }) => theme.textColor};
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
  color: ${({ theme }) => theme.textColor};
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

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

const getMoment = (CountyName) => {
  const locations = Object.values(
    sunriseAndSunsetData.cwaopendata.dataset.location
  );
  const location = locations.find((data) => data.CountyName === CountyName);
  if (!location || !Array.isArray(location.time)) return null;
  const now = new Date();
  const nowDate = Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/\//g, "-");

  const locationDate =
    location.time && location.time.find((time) => time.Date === nowDate);

  if (!locationDate) return null;

  const sunriseTimestamp = new Date(
    `${locationDate.Date} ${locationDate.SunRiseTime}`
  ).getTime();
  const sunsetTimestamp = new Date(
    `${locationDate.Date} ${locationDate.SunSetTime}`
  ).getTime();
  const nowTimeStamp = now.getTime();

  return sunriseTimestamp <= nowTimeStamp && nowTimeStamp <= sunsetTimestamp
    ? "day"
    : "night";
};

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
    isLoading: true,
  });

  const {
    observationTime,
    stationName,
    description,
    temperature,
    windSpeed,
    humid,
    weatherCode,
    rainPossibility,
    comfortability,
    isLoading,
  } = weatherElement;

  const fetchData = useCallback(() => {
    const fetchingData = async () => {
      const [currentWeather, weatherForecast] = await Promise.all([
        fetchCurrentWeather(),
        fetchWeatherForecast(),
      ]);
      setWeatherElement({
        ...currentWeather,
        ...weatherForecast,
        isLoading: false,
      });
    };

    setWeatherElement((prevState) => ({
      ...prevState,
      isLoading: true,
    }));

    fetchingData();
  }, []);

  const moment = useMemo(
    () => getMoment(weatherElement.CountyName),
    [weatherElement.CountyName]
  );

  useEffect(() => {
    console.log("execute function in useEffect.");
    fetchData();
  }, [fetchData]);

  return (
    <ThemeProvider theme={theme.dark}>
      <Container>
        {console.log("render, is Loading: ", isLoading)}
        <WeatherCard>
          <Location>{stationName}</Location>
          <Description>
            {description}
            {comfortability}
          </Description>
          <CurrentWeather>
            <Temperature>
              {Math.round(temperature)} <Celsius>°C</Celsius>
            </Temperature>
            <WeatherIcon
              currentWeatherCode={weatherCode}
              moment={moment || "day"}
            />
          </CurrentWeather>
          <AirFlow>
            <AirFlowIcon />
            {windSpeed} m/h
          </AirFlow>
          <Rain>
            <RainIcon />
            {rainPossibility}%
          </Rain>

          <Refresh onClick={fetchData} isLoading={isLoading}>
            最後觀測時間:
            {new Intl.DateTimeFormat("zh-TW", {
              hour: "numeric",
              minute: "numeric",
            }).format(new Date(observationTime))}{" "}
            {isLoading ? <LoadingIcon /> : <RedoIcon />}
          </Refresh>
        </WeatherCard>
      </Container>
    </ThemeProvider>
  );
};

export default WeatherApp;

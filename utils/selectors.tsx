import { useState } from 'react';
import { Button, Menu } from 'react-native-paper';
import {
  MONTH_NAMES,
  MonthName,
  SchoolYearHalf,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';

export function getCurrentSchoolYearStart() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return currentMonth >= 8 ? currentYear : currentYear - 1;
}

export function getAvaliableYears() {
  const currentSchoolYearStart = getCurrentSchoolYearStart();

  return [
    currentSchoolYearStart,
    currentSchoolYearStart - 1,
    currentSchoolYearStart - 2,
    currentSchoolYearStart - 3,
  ];
}

export function getMonthNames() {
  return {
    JANUARY: 'Leden',
    FEBRUARY: 'Únor',
    MARCH: 'Březen',
    APRIL: 'Duben',
    MAY: 'Květen',
    JUNE: 'Červen',
    JULY: 'Červenec',
    AUGUST: 'Srpen',
    SEPTEMBER: 'Září',
    OCTOBER: 'Říjen',
    NOVEMBER: 'Listopad',
    DECEMBER: 'Prosinec',
  } satisfies Record<MonthName, string>;
}

export function MonthSelector({
  selected,
  handleSelectMonth,
}: {
  selected?: MonthName;
  handleSelectMonth: (m: MonthName) => unknown;
}) {
  const months = MONTH_NAMES;
  const monthNames = getMonthNames();
  const [visible, setVisible] = useState(false);
  const date = new Date();
  const [selectedMonth, setSelectedMonth] = useState<MonthName>(
    selected || MONTH_NAMES[date.getMonth()]
  );

  return (
    <>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button mode="outlined" onPress={() => setVisible(true)}>
            {monthNames[selectedMonth]}
          </Button>
        }
      >
        {months.map(m => (
          <Menu.Item
            key={m}
            onPress={() => {
              setSelectedMonth(m);
              handleSelectMonth(m);
              setVisible(false);
            }}
            title={monthNames[m]}
          />
        ))}
      </Menu>
    </>
  );
}

export function YearSelector({
  selected,
  handleSelectYear,
}: {
  selected?: number;
  handleSelectYear: (y: number) => unknown;
}) {
  const [visible, setVisible] = useState(false);
  const avaliableSchoolYears = getAvaliableYears();
  const [selectedYear, setSelectedYear] = useState<number>(
    selected || avaliableSchoolYears[0]
  );

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button mode="outlined" onPress={() => setVisible(true)}>
          {selectedYear}/{selectedYear + 1}
        </Button>
      }
    >
      {avaliableSchoolYears.map(y => (
        <Menu.Item
          key={y}
          onPress={() => {
            setSelectedYear(y);
            handleSelectYear(y);
            setVisible(false);
          }}
          title={`${y}/${y + 1}`}
        />
      ))}
    </Menu>
  );
}

export function HalfSelector({
  selected,
  handleSelectHalf,
}: {
  selected: SchoolYearHalf;
  handleSelectHalf: (half: SchoolYearHalf) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button mode="outlined" onPress={() => setVisible(true)}>
          {selected === 'FIRST' ? '1. pololetí' : '2. pololetí'}
        </Button>
      }
    >
      <Menu.Item
        onPress={() => {
          handleSelectHalf('FIRST');
          setVisible(false);
        }}
        title="1. pololetí"
      />
      <Menu.Item
        onPress={() => {
          handleSelectHalf('SECOND');
          setVisible(false);
        }}
        title="2. pololetí"
      />
    </Menu>
  );
}

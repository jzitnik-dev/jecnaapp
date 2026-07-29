import { clearCache } from '@/services/grades/gradeCache';
import { getChangesWithCache } from '@/services/grades/gradeChecking';
import { JecnaAPI } from 'jecnaapi-react-native';
import { Grade, GradesPage } from 'jecnaapi-react-native/jecnaapi';
import { Alert } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';

async function setCustomCache() {
  const page = await JecnaAPI.getGradesPage();

  // Mutate
  removeGradeMutably(page, 1304847);
  editGradeMutably(page, {
    gradeId: 1308738,
    value: 2,
    small: false,
    description: 'Minutka Jamese Bonda',
    receiveDate: new Date('2026-06-19'),
    teacher: {
      full: 'Ing. Jan Novotný, Ph.D.',
      short: 'NV',
    },
  });

  clearCache();
  await getChangesWithCache(page);

  Alert.alert('DONE!');
}

function removeGradeMutably(gradesPage: GradesPage, idToDelete: number) {
  for (const subject of Object.values(gradesPage.subjectsMap)) {
    const partsMap = subject.grades.subjectPartsGrades;

    for (const partKey in partsMap) {
      partsMap[partKey] = partsMap[partKey].filter(
        grade => grade.gradeId !== idToDelete
      );
    }
  }
}

function editGradeMutably(gradesPage: GradesPage, updatedGrade: Grade) {
  for (const subject of Object.values(gradesPage.subjectsMap)) {
    const partsMap = subject.grades.subjectPartsGrades;

    for (const partKey in partsMap) {
      const gradesArray = partsMap[partKey];

      const gradeIndex = gradesArray.findIndex(
        grade => grade.gradeId === updatedGrade.gradeId
      );

      if (gradeIndex !== -1) {
        gradesArray[gradeIndex] = updatedGrade;

        return;
      }
    }
  }
}

export default function NotificationDebug({
  modalVisible,
  setModalVisible,
}: {
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={{
          margin: 20,
          padding: 20,
          borderRadius: 10,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 25,
            marginBottom: 8,
            color: theme.colors.onSurface,
          }}
        >
          DEBUG
        </Text>

        <Button
          mode="outlined"
          compact
          onPress={() => {
            setCustomCache();
          }}
          style={{ borderRadius: 8 }}
        >
          Set custom cache
        </Button>
      </Modal>
    </Portal>
  );
}

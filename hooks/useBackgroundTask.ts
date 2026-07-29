import { useState, useEffect } from 'react';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

interface UseBackgroundTaskOptions {
  taskName: string;
  onRegister: () => Promise<void>;
}

export function useBackgroundTask({
  taskName,
  onRegister,
}: UseBackgroundTaskOptions) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const isTaskRegistered =
          await TaskManager.isTaskRegisteredAsync(taskName);
        setIsRegistered(isTaskRegistered);
      } catch (error) {
        console.error(`Failed to check status for task [${taskName}]:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [taskName]);

  const toggleTask = async () => {
    setIsLoading(true);
    try {
      if (isRegistered) {
        await BackgroundTask.unregisterTaskAsync(taskName);
        setIsRegistered(false);
      } else {
        await onRegister();

        const isTaskRegistered =
          await TaskManager.isTaskRegisteredAsync(taskName);
        setIsRegistered(isTaskRegistered);
      }
    } catch (error) {
      console.error(`Failed to toggle background task [${taskName}]:`, error);
      alert('Something went wrong while changing the background task setting.');
    } finally {
      setIsLoading(false);
    }
  };

  return { isRegistered, isLoading, toggleTask };
}

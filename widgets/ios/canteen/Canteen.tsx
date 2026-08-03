import { createWidget } from 'expo-widgets';
import type { WidgetEnvironment } from 'expo-widgets';
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  lineLimit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react/jsx-runtime';
import type { WidgetData, WidgetProps } from '../task-handler';
import { AditionalCache, WidgetContent, fetcher } from './fetcher';
import { findOrderedLunch } from '@/utils/canteen/todayLunch';

function CanteenWidget(
  props: WidgetProps<WidgetContent>,
  _environment: WidgetEnvironment
): JSX.Element {
  'widget';

  const data = props.data;

  if (!data || data.type === 'fetching') {
    return (
      <VStack
        alignment="center"
        modifiers={[containerBackground('#1a1a1a', 'widget')]}
      >
        <Spacer />
        <Text modifiers={[font({ size: 16 }), foregroundStyle('#ffffff')]}>
          Načítání...
        </Text>
        <Spacer />
      </VStack>
    );
  }

  if (data.type === 'error') {
    return (
      <VStack
        alignment="center"
        modifiers={[containerBackground('#1a1a1a', 'widget')]}
      >
        <Spacer />
        <Text modifiers={[font({ size: 16 }), foregroundStyle('#ffffff')]}>
          Chyba při načítání
        </Text>
        <Spacer />
      </VStack>
    );
  }

  const { page, theme } = data.content;
  const ordered = findOrderedLunch(page);

  return (
    <VStack
      alignment="leading"
      spacing={10}
      modifiers={[containerBackground(theme.surface, 'widget')]}
    >
      <HStack spacing={6}>
        <Image systemName="fork.knife" size={18} color={theme.onSurface} />
        <Text
          modifiers={[
            font({ size: 16, weight: 'bold' }),
            foregroundStyle(theme.onSurface),
          ]}
        >
          Dnešní jídlo
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 13, weight: 'bold' }),
            foregroundStyle(theme.onSurface),
            background(
              theme.surfaceVariant,
              shapes.roundedRectangle({ cornerRadius: 8 })
            ),
            padding({ horizontal: 8, vertical: 4 }),
          ]}
        >
          {`${page.credit} Kč`}
        </Text>
      </HStack>

      {ordered ? (
        <VStack
          alignment="leading"
          spacing={6}
          modifiers={[
            background(
              theme.surfaceVariant,
              shapes.roundedRectangle({ cornerRadius: 12 })
            ),
            padding({ all: 12 }),
            cornerRadius(12),
          ]}
        >
          {ordered.description.soup ? (
            <VStack alignment="leading" spacing={2}>
              <Text
                modifiers={[
                  font({ size: 11, weight: 'bold' }),
                  foregroundStyle(theme.onSurfaceVariant),
                ]}
              >
                Polévka
              </Text>
              <Text
                modifiers={[
                  font({ size: 13 }),
                  foregroundStyle(theme.onSurface),
                  lineLimit(2),
                ]}
              >
                {ordered.description.soup}
              </Text>
            </VStack>
          ) : null}

          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[
                font({ size: 11, weight: 'bold' }),
                foregroundStyle(theme.onSurfaceVariant),
              ]}
            >
              {`Jídlo ${ordered.number}`}
            </Text>
            <Text
              modifiers={[
                font({ size: 13 }),
                foregroundStyle(theme.onSurface),
                lineLimit(2),
              ]}
            >
              {ordered.description.rest}
            </Text>
          </VStack>
        </VStack>
      ) : (
        <VStack
          alignment="center"
          spacing={8}
          modifiers={[
            background(
              theme.surfaceVariant,
              shapes.roundedRectangle({ cornerRadius: 12 })
            ),
            padding({ all: 16 }),
            cornerRadius(12),
          ]}
        >
          <Spacer />
          <Image
            systemName="fork.knife.circle"
            size={36}
            color={theme.onSurfaceVariant}
          />
          <Text
            modifiers={[
              font({ size: 13 }),
              foregroundStyle(theme.onSurfaceVariant),
              lineLimit(2),
            ]}
          >
            Dnes nemáte objednané žádné jídlo
          </Text>
          <Spacer />
        </VStack>
      )}
    </VStack>
  );
}

export const Canteen = {
  component: CanteenWidget,
  fetcher,
} satisfies WidgetData<WidgetContent, AditionalCache>;

export const CanteenWidgetInstance = createWidget<WidgetProps<WidgetContent>>(
  'Canteen',
  CanteenWidget
);

import { Box, Title, Text } from '@mantine/core'

export const Customize: React.FC = () => {
  return (
    <Box>
      <Title order={2}>Customize</Title>
      <Text c="dimmed" mt="xs">
        Define how the bot behaves & looks
      </Text>
    </Box>
  )
}

import { Box, Title, Text } from '@mantine/core'

export const Chats: React.FC = () => {
  return (
    <Box>
      <Title order={2}>Chats</Title>
      <Text c="dimmed" mt="xs">
        Monitor conversations (ongoing)
      </Text>
    </Box>
  )
}

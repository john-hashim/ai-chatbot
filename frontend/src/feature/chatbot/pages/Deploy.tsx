import { Box, Title, Text } from '@mantine/core'

export const Deploy: React.FC = () => {
  return (
    <Box>
      <Title order={2}>Deploy</Title>
      <Text c="dimmed" mt="xs">
        Publish your chatbot (done once or rarely)
      </Text>
    </Box>
  )
}

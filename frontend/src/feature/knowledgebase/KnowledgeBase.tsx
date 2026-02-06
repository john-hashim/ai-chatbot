import { Box, Title, Text } from '@mantine/core'

export const KnowledgeBase: React.FC = () => {
  return (
    <Box>
      <Title order={2}>Knowledge Base</Title>
      <Text c="dimmed" mt="xs">
        Teach it information (updated occasionally)
      </Text>
    </Box>
  )
}

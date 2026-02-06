import { Box, Title, Text } from '@mantine/core'

export const Analytics: React.FC = () => {
  return (
    <Box>
      <Title order={2}>Analytics</Title>
      <Text c="dimmed" mt="xs">
        Check performance (sometimes)
      </Text>
    </Box>
  )
}

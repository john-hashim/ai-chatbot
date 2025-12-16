import { Button, TextInput } from '@mantine/core'
import { useState } from 'react'
import { Tabs } from '@mantine/core'
import { Info, Link, ListTree } from 'lucide-react'

export const UploadLinks: React.FC = () => {
  const [url, setUrl] = useState('')
  const handleSubmit = () => {}
  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Website</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Enter your website URL so the AI can learn from your latest content.
        </p>
      </header>
      <Tabs defaultValue="gallery" className="mt-10">
        <Tabs.List>
          <Tabs.Tab value="url" leftSection={<Link size={15} />}>
            Website
          </Tabs.Tab>
          <Tabs.Tab value="sitemap" leftSection={<ListTree size={15} />}>
            Sitemap
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="url">
          <div className="mt-5">
            <p className="text-text-secondary text-sm">URL</p>
            <TextInput
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="mt-1"
              type="text"
              id="text-title"
              placeholder="Pricings Plans"
            />
            <div className="my-2 py-2 flex items-center px-4 bg-background-dark-week rounded-xl text-sm text-text-weak">
              <span>
                <Info size={15} />
              </span>{' '}
              <p className="ml-2">
                Add a single webpage to your knowledge base. The content from this page will be
                extracted and processed.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => handleSubmit()}
              variant="default"
              disabled={!url.trim() || !url.trim()}
            >
              Fetch data from link
            </Button>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="sitemap">
          {' '}
          <div className="mt-5">
            <p className="text-text-secondary text-sm">URL</p>
            <TextInput
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="mt-1"
              type="text"
              id="text-title"
              placeholder="Pricings Plans"
            />
            <div className="my-2 py-2 flex items-center px-4 bg-background-dark-week rounded-xl text-sm text-text-weak">
              <span>
                <Info size={18} />
              </span>{' '}
              <p className="ml-2">
                Add multiple pages at once using a sitemap XML file (usually found at
                example.com/sitemap.xml). All pages listed will be crawled and added.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => handleSubmit()}
              variant="default"
              disabled={!url.trim() || !url.trim()}
            >
              Load Sitemap
            </Button>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

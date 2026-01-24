import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { bulkScrapeUrlsFn, mapUrlFn, scrapeUrlFn } from '@/data/items'
import { bulkImportSchema, importSchema } from '@/schemas/import'
import { type SearchResultWeb } from '@mendable/firecrawl-js'
import { useForm } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { Globe, LinkIcon, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/import')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isPending, startTransition] = useTransition()
  const [bulkIsPending, startBulkTransition] = useTransition()

  // Bulk import state
  const [discoveredLinks, setDiscoveredLinks] = useState<Array<SearchResultWeb>>([])

  const [selectedURLs, setSelectedURLs] = useState<Set<string>>(new Set())

  function handleSelectAll() {
    if (selectedURLs.size === discoveredLinks.length ) {
      setSelectedURLs( new Set())
    } else {
      setSelectedURLs(new Set(discoveredLinks.map((link) => link.url)))
    }
  }

  function handleToggleUrl(url: string) {
    const newSelected = new Set(selectedURLs)

    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }

    setSelectedURLs(newSelected)
  }

  function handleBulkImport() {
    startBulkTransition(async () => {
      if (selectedURLs.size === 0) {
      toast.error('Please select at least one URL to import.')
      return
    }

    await bulkScrapeUrlsFn({ data: { urls: Array.from(selectedURLs) }})
  
    toast.success(`Successfully imported ${selectedURLs.size} URLs`)
    })
  }

  const form = useForm({
    defaultValues: {
      url: '',
    },
    validators: {
      onSubmit: importSchema,
    },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        console.log(value)
        await scrapeUrlFn({ data: value })
        toast.success('URL scraped successfully')
      })
    },
  })

  const bulkForm = useForm({
    defaultValues: {
      url: '',
      search: '',
    },
    validators: {
      onSubmit: bulkImportSchema,
    },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        console.log(value)
        const data = await mapUrlFn({ data: value })

        setDiscoveredLinks(data)
      })
    },
  })

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Import Content</h1>
          <p className="text-muted-foreground pt-1">
            Save web pages to your library for later reading
          </p>
        </div>

        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <LinkIcon className="size-4" />
              Single URL
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Globe className="size-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Import Single URL</CardTitle>
                <CardDescription>
                  Scrape and save any content from any web app ⚡
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                  }}
                >
                  <FieldGroup>
                    <form.Field
                      name="url"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="https://ui.shadcn.com/"
                              type="url"
                              autoComplete="off"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Import URL'
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Import Bulk URLs</CardTitle>
                <CardDescription>
                  Discover and import multiple URLs from a website at once 🚀
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    bulkForm.handleSubmit()
                  }}
                >
                  <FieldGroup>
                    <bulkForm.Field
                      name="url"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="https://ui.shadcn.com/"
                              type="url"
                              autoComplete="off"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />

                    <bulkForm.Field
                      name="search"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              Filter (optional)
                            </FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="e.g., blog, docs, tutorial"
                              autoComplete="off"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Import URLs'
                      )}
                    </Button>
                  </FieldGroup>
                </form>

                {/* Discovered URLs list */}
                { discoveredLinks.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium'>
                        Found { discoveredLinks.length } URLs
                      </p>
                      <Button onClick={handleSelectAll} variant='outline' size='sm'>
                        {selectedURLs.size === discoveredLinks.length ? 'Deselect all' : 'Select all'}
                      </Button>
                    </div>

                    <div className='max-h-80 space-y-2 overflow-y-auto rounded-md border p-4'>
                      { discoveredLinks.map((link) => (
                        <label key={ link.url } className='hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2'>
                          <Checkbox 
                            checked={selectedURLs.has(link.url)} 
                            onCheckedChange={() => handleToggleUrl(link.url)} 
                            className='mt-0.5'
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>
                              { link.title ?? 'Title not found' }
                            </p>

                            <p className='text-muted-foreground truncate text-xs'>
                              { link.description ?? 'Description not found' }
                            </p>

                            <p className='text-muted-foreground truncate text-xs'>
                              { link.url }
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <Button disabled={bulkIsPending} onClick={handleBulkImport} className='w-full' type="button">
                      {bulkIsPending ? (
                        <>
                          <Loader2 className='size-4 animate-spin'/>
                          Importing...
                        </>
                      ) : (
                        `Import ${selectedURLs.size} URLs`
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

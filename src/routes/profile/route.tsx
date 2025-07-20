
import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherTrendingUp } from "@subframe/core";
import { FeatherSparkle } from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherMessageCircle } from "@subframe/core";
import { FeatherBell } from "@subframe/core";
import { Avatar } from "@/ui/components/Avatar";
import { FeatherVerified } from "@subframe/core";
import { FeatherShare2 } from "@subframe/core";
import { FeatherYoutube } from "@subframe/core";
import { FeatherInstagram } from "@subframe/core";
import { Tabs } from "@/ui/components/Tabs";
import { FeatherListFilter } from "@subframe/core";
import { FeatherArrowUpDown } from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherLayoutGrid } from "@subframe/core";
import { FeatherLayoutList } from "@subframe/core";
import { FeatherPlay } from "@subframe/core";
import { Badge } from "@/ui/components/Badge";
import { FeatherChevronLeft } from "@subframe/core";
import { FeatherCircle } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";

function UserProfileHub() {
  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start">
        <div className="flex w-full items-center justify-end gap-2 border-b border-solid border-neutral-border px-8 py-2">
          <Button
            variant="neutral-tertiary"
            icon={<FeatherTrendingUp />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            128
          </Button>
          <Button
            variant="brand-tertiary"
            size="large"
            icon={<FeatherSparkle />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            Pro
          </Button>
          <IconButton
            size="large"
            icon={<FeatherMessageCircle />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          />
          <IconButton
            size="large"
            icon={<FeatherBell />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          />
        </div>
        <div className="container max-w-none flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 bg-default-background py-12 overflow-auto">
          <div className="flex w-full flex-col items-start gap-12">
            <div className="flex w-full flex-col items-start gap-4 relative">
              <img
                className="h-60 w-full flex-none rounded-md object-cover"
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
              />
              <div className="flex flex-col items-start gap-4 rounded-full border-2 border-solid border-default-background shadow-lg absolute left-4 -bottom-4">
                <Avatar
                  size="x-large"
                  image="https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                >
                  S
                </Avatar>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-heading-1 font-heading-1 text-default-font">
                    SoundScape
                  </span>
                  <FeatherVerified className="text-heading-2 font-heading-2 text-brand-700" />
                </div>
                <div className="flex items-center">
                  <IconButton
                    icon={<FeatherShare2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    icon={<FeatherYoutube />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    icon={<FeatherInstagram />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-12">
                <div className="flex flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Visualizations
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    248
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Followers
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    1.2k
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Downloads
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    3.4k
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-6">
            <Tabs>
              <Tabs.Item active={true}>Collection</Tabs.Item>
              <Tabs.Item>Favorites</Tabs.Item>
              <Tabs.Item>Activity</Tabs.Item>
            </Tabs>
            <div className="flex w-full flex-wrap items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="neutral-secondary"
                  icon={<FeatherListFilter />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                >
                  Filter
                </Button>
                <Button
                  variant="neutral-secondary"
                  icon={<FeatherArrowUpDown />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                >
                  Sort by plays
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <TextField label="" helpText="" icon={<FeatherSearch />}>
                  <TextField.Input
                    placeholder="Search visualizations"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
                <ToggleGroup value="" onValueChange={(value: string) => {}}>
                  <ToggleGroup.Item
                    icon={<FeatherLayoutGrid />}
                    value="8b28fa1c"
                  >
                    Grid
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    icon={<FeatherLayoutList />}
                    value="61fcd3f2"
                  >
                    Carousel
                  </ToggleGroup.Item>
                </ToggleGroup>
              </div>
            </div>
            <div className="flex w-full items-start pb-4 overflow-auto">
              <div className="flex items-start gap-4">
                <div className="flex w-96 flex-none flex-col items-start overflow-hidden rounded-md border border-solid border-neutral-border bg-default-background shadow-sm">
                  <div className="flex w-full grow shrink-0 basis-0 flex-col items-start relative">
                    <img
                      className="h-60 w-full flex-none border-b border-solid border-neutral-border object-cover"
                      src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    />
                    <IconButton
                      className="absolute right-2 top-2"
                      variant="inverse"
                      icon={<FeatherPlay />}
                      onClick={(
                        event: React.MouseEvent<HTMLButtonElement>
                      ) => {}}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-1 px-4 py-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Neon Waves
                        </span>
                        <Badge>New</Badge>
                      </div>
                      <span className="text-caption font-caption text-subtext-color">
                        2.1k plays
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-96 flex-none flex-col items-start overflow-hidden rounded-md border border-solid border-neutral-border bg-default-background shadow-sm">
                  <div className="flex w-full grow shrink-0 basis-0 flex-col items-start relative">
                    <img
                      className="h-60 w-full flex-none border-b border-solid border-neutral-border object-cover"
                      src="https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    />
                    <IconButton
                      className="absolute right-2 top-2"
                      variant="inverse"
                      icon={<FeatherPlay />}
                      onClick={(
                        event: React.MouseEvent<HTMLButtonElement>
                      ) => {}}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-1 px-4 py-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Pulse Echo
                        </span>
                        <Badge variant="success">Trending</Badge>
                      </div>
                      <span className="text-caption font-caption text-subtext-color">
                        4.5k plays
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-96 flex-none flex-col items-start overflow-hidden rounded-md border border-solid border-neutral-border bg-default-background shadow-sm">
                  <div className="flex w-full grow shrink-0 basis-0 flex-col items-start relative">
                    <img
                      className="h-60 w-full flex-none border-b border-solid border-neutral-border object-cover"
                      src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    />
                    <IconButton
                      className="absolute right-2 top-2"
                      variant="inverse"
                      icon={<FeatherPlay />}
                      onClick={(
                        event: React.MouseEvent<HTMLButtonElement>
                      ) => {}}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-1 px-4 py-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Sonic Prism
                        </span>
                      </div>
                      <span className="text-caption font-caption text-subtext-color">
                        1.8k plays
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-center gap-2">
              <IconButton
                icon={<FeatherChevronLeft />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
              <div className="flex items-center gap-1">
                <IconButton
                  variant="brand-primary"
                  icon={<FeatherCircle />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
                <IconButton
                  icon={<FeatherCircle />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
                <IconButton
                  icon={<FeatherCircle />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </div>
              <IconButton
                icon={<FeatherChevronRight />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default UserProfileHub;
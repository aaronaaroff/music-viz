import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherGrid } from "@subframe/core";
import { FeatherList } from "@subframe/core";
import { Button } from "@/ui/components/Button";
import { FeatherPlus } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { Avatar } from "@/ui/components/Avatar";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherMoreVertical } from "@subframe/core";
import { FeatherHeart } from "@subframe/core";
import { FeatherMessageCircle } from "@subframe/core";
import { FeatherBookmark } from "@subframe/core";
import { Badge } from "@/ui/components/Badge";
import { Slider } from "@/ui/components/Slider";

function SavedPage() {
  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start overflow-hidden">
        <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-8 py-2">
          <TextField
            className="h-auto grow shrink-0 basis-0"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Search saved visualizations..."
              value=""
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
            />
          </TextField>
          <div className="flex items-center gap-2">
            <ToggleGroup value="" onValueChange={(value: string) => {}}>
              <ToggleGroup.Item icon={<FeatherGrid />} value="1b03c104" />
              <ToggleGroup.Item icon={<FeatherList />} value="0248073d" />
            </ToggleGroup>
            <Button
              icon={<FeatherPlus />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Create New
            </Button>
            <Button
              variant="neutral-tertiary"
              icon={<FeatherFilter />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Filters
            </Button>
          </div>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 items-start overflow-hidden">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6 self-stretch px-6 py-6 overflow-auto">
            <div className="w-full items-start gap-6 grid grid-cols-3">
              <div className="flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-4 mobile:flex-col mobile:flex-nowrap mobile:justify-between">
                <div className="flex h-48 w-full flex-none items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                  <img
                    className="grow shrink-0 basis-0 self-stretch object-cover"
                    src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                  />
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="small"
                      image="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    >
                      JD
                    </Avatar>
                    <span className="text-body-bold font-body-bold text-default-font">
                      Neon Waves
                    </span>
                  </div>
                  <IconButton
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full items-center justify-center gap-4">
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherHeart />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    124
                  </Button>
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherMessageCircle />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    18
                  </Button>
                  <IconButton
                    icon={<FeatherBookmark />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-4">
                <div className="flex h-48 w-full flex-none items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                  <img
                    className="grow shrink-0 basis-0 self-stretch object-cover"
                    src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                  />
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="small"
                      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    >
                      SR
                    </Avatar>
                    <span className="text-body-bold font-body-bold text-default-font">
                      Pulse Echo
                    </span>
                  </div>
                  <IconButton
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full items-center justify-center gap-4">
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherHeart />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    89
                  </Button>
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherMessageCircle />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    12
                  </Button>
                  <IconButton
                    icon={<FeatherBookmark />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-4">
                <div className="flex h-48 w-full flex-none items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                  <img
                    className="grow shrink-0 basis-0 self-stretch object-cover"
                    src="https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                  />
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="small"
                      image="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    >
                      MK
                    </Avatar>
                    <span className="text-body-bold font-body-bold text-default-font">
                      Sonic Drift
                    </span>
                  </div>
                  <IconButton
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full items-center justify-center gap-4">
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherHeart />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    76
                  </Button>
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherMessageCircle />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    8
                  </Button>
                  <IconButton
                    icon={<FeatherBookmark />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex max-w-[320px] grow shrink-0 basis-0 flex-col items-start gap-6 self-stretch border-l border-solid border-neutral-border px-6 py-6 overflow-auto">
            <div className="flex w-full flex-col items-start gap-3">
              <span className="text-body-bold font-body-bold text-default-font">
                Categories
              </span>
              <div className="flex w-full flex-wrap items-start gap-2">
                <Badge>All</Badge>
                <Badge variant="neutral">Ambient</Badge>
                <Badge variant="neutral">Electronic</Badge>
                <Badge variant="neutral">Hip Hop</Badge>
                <Badge variant="neutral">Rock</Badge>
                <Badge variant="neutral" icon={<FeatherPlus />} />
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-3">
              <span className="text-body-bold font-body-bold text-default-font">
                Sort by
              </span>
              <ToggleGroup
                className="h-auto w-full flex-none"
                value=""
                onValueChange={(value: string) => {}}
              >
                <ToggleGroup.Item icon={null} value="5e2cac3b">
                  Date Saved
                </ToggleGroup.Item>
                <ToggleGroup.Item icon={null} value="d452097b">
                  Recent
                </ToggleGroup.Item>
                <ToggleGroup.Item icon={null} value="90ebb6f9">
                  Popular
                </ToggleGroup.Item>
              </ToggleGroup>
            </div>
            <div className="flex w-full flex-col items-start gap-3">
              <span className="text-body-bold font-body-bold text-default-font">
                Duration
              </span>
              <Slider
                value={[50]}
                onValueChange={(value: number[]) => {}}
                onValueCommit={(value: number[]) => {}}
              />
              <div className="flex w-full items-center justify-between">
                <span className="text-caption font-caption text-subtext-color">
                  0:30
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  10:00
                </span>
              </div>
            </div>
            {/* Trending Creators section removed from saved page */}
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default SavedPage;
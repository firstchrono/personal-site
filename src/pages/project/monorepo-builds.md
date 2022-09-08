---
layout: ../../layouts/project.astro
title: "Azure Pipelines and Monorepo"
publishDate: 2021-10-20
category:
  - DevOps
img: /assets/blog/azurePipelinesMonorepoEdition.jpeg
author: Jon
tags: 
  - devops
  - pipelines
draft: true
---
_Note: This isn't going to be a discussion about the monorepo. You can find plenty of blogs about it and quite frankly, I'm not the right person to discuss the topic._

Recently, the development team that I work with ran into some issues regarding references for their Angular apps. The Architect decided that after a conversation with the Angular team, we should use a _monorepo_ for these two front-end apps.

Monorepo? As a former Software Engineer (legacy C#/WinForms, .Net Framework), this word scared me. I spent two days just dumbfounded that a massive multi-app product in today's world would utilize a monorepo. After some research, I find out that Facebook, Microsoft, Nvidia, and even Google use a monorepo. Ok, cool. Now the million dollar question, how does DevOps handle a monorepo, let alone in Azure Pipelines?

I looked around and got some ideas. While I could understand the solution in an abstract way, I was running into some issues with the concrete implementation. The basic intent of this guide is to cover the solution I ended up using. I'm not going to cover my pipeline beyond the monorepo design,

My requirements were fairly simple:

* Build each project **if** it's project files were changes
  * Example: We have two projects, A & B. We change the files in A, I'd expect _only_ A to build.
* Build all projects **if** core files change (libraries, package.json, etc)
* PR Status Checks/Gates would function as normal and still would only build the required projects based on changes in PR.
* Utilize our template build pipeline system to make it easier to expand when more projects are included in the repo (when designing this I was told at least a 3rd was being added).
* Deployments would still be a 1-to-1 relationship (deployment pipeline for project A is tied to build pipeline for project A)
* Wouldn't change our existing deployment pipeline (created before my time here)
  * We are in the process of redesigning our deployments (moving to GitOps) and I wanted the builds to be independent and support any changes.

The first and most obvious way, to me, to fullfil the requirements was to utilize `git diff` and determine the source code changes. Essentially, when the branches triggered a build, the pipeline would run a `git diff` and compare `HEAD` to `HEAD~1`. This would provide a list of files that were changed. From there, you could check to see if the files were from specific folders. Once the folders were determined, then the pipeline could customize the build script to build only specific apps.

~image of code example~

~image of pipeline example~

Let's check the requirements and see how it does:

* :heavy_check_mark: Build each project **if** it's project files were changes
* :heavy_check_mark: Build all projects **if** core files change (libraries, package.json, etc)
* :heavy_check_mark: PR Status Checks/Gates would function as normal and still would only build the required projects based on changes in PR.
* :heavy_check_mark: Utilize our template build pipeline system to make it easier to expand when more projects are included in the repo
* :white_check_mark: Deployments would still be a 1-to-1 relationship
* :heavy_check_mark: Wouldn't change our existing deployment pipeline

Okay, not bad 5/6 requirements were met with this solution. However, it was a bit cumbersome. It worked, don't get me wrong, I just didn't _like_ it. It felt, messy. Technically, it was one build pipeline, with multiple jobs: each job pertaining to an app in the repo. It didn't truly satisfy my 1-to-1 relationship for build and deploy pipelines. At this point, I had an idea of what I wanted to do, I just needed to understand _how_ to implement it in Azure Pipelines.

Along came "Path Triggers". At first glance, this was the end-game solution for my search. By limiting the paths for the pipeline, each app can have it's own pipeline. It prevents the unnecessary extra code of trying to calculate the changes myself. This was cleaner _and_ easier to maintain in the long run. The configuration is fairly simple, you place a yaml file at the root of each project. You can even put a yaml file at the root of the repo for a build pipeline for the entire repo.

~example file structure~

Now that we know the solution is "Path Triggers", how do we configure them? You use the `include` tag with the folders/files that you want the pipeline to look at for building. Then, you use the `exclude` tag to ignore the other project folders. Below you'll see an example yaml from "Project A" of a monorepo. It's not complex. If you add a new project, you can copy/paste the file and make a few minor changes to it and the existing files.

![image](/assets/blog/blogimages/TemplateYamlForMonorepo.svg)

You're probably thinking to yourself, "Hey, why do I need the exclude section if the include has what _is needed_?", and you'd be right in asking that question. Simply put, I'd rather declare the exclusion than imply the exclusion. In our case, it's only three extra lines and it doesn't negatively impact any of the other pipelines.

Outside of the addition of the new yaml files and the include/exclude sections, nothing else changes in my pipeline. It was essentially a small change to keep plug 'n play capability. So let's check the requirements:

* :heavy_check_mark: Build each project **if** it's project files were changes
* :heavy_check_mark: Build all projects **if** core files change (libraries, package.json, etc)
* :heavy_check_mark: PR Status Checks/Gates would function as normal and still would only build the required projects based on changes in PR.
* :heavy_check_mark: Utilize our template build pipeline system to make it easier to expand when more projects are included in the repo
* :heavy_check_mark: Deployments would still be a 1-to-1 relationship
* :heavy_check_mark: Wouldn't change our existing deployment pipeline

~he shoots and scores~

Solid choice.

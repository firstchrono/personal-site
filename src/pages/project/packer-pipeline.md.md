---
layout: ../../layouts/project.astro
title: "Azure Pipelines, VM Scale Sets, and Packer Imaging"
publishDate: 2022-06-01
category:
  - DevOps
  - Pipelines
  - Azure
  - Packer
img: /assets/blog/azurePipelines.jpeg
author: Jon
tags: 
  - devops
draft: true
---

You're probably here because you don't want to use Microsoft's Hosted Agents for the build pipelines. The reasons might look like:

* You want concurrency but don't want to pay for it.
* You need more build time than the free limit provides.
* You want control over images and the software installed on them.
* You don't trust ADO to always have their agents available.

No matter _what_ your reasoning is for wanting to make the change, you ended up here.

When I entered a DevOps organization, there were some major cleanup tasks I needed to complete. The main priority I set for myself (Management agreed), was cleaning up their build systems and processes. They were running a single Windows build server with four agents. The problem? Well, here's a few:

_Note: This isn't bashing. I'm trying to explain the factors that drove me to making these changes and they might provide insight for someone else who has similar problems and is trying to approach this change as well._

* 4 agents, over 20 different pipelines (build and release) that _could_ be run. 20 > 4. Early on, this wasn't an issue as the main team was small (< 10 devs). This quickly became a problem as they hired more developers.
* The server ran 24/7 and would routinely go without updates (this is completely separate from the rest of the work I did, this should be covered under some security policy).
* We required Docker for both Linux and Windows containers, but the previous engineer setup Docker Desktop. So, yes, the server required a logged in user or Docker would fail.
* Docker would routinely crash.
* Since it was a 24/7 that was never cleared, it had build data from nearly a year ago. This caused some bad habits in the build pipelines (like storing files in a directory and using it later in a different pipeline instead of using artifacts or blob storage).

To overcome these issues I decided to use a Virtual Machine Scale Set (VMSS) in Azure to host our own agents for builds. This would allow us to have ephemeral machines. They only exist for the job required, then are destroyed. I'm not going to cover VMSS indepth in this post. There are plenty of other blogs that cover the useful nature of VMSS.

The generic theory used was that we have approximately 10 different repos that can build, so, let's double it. The Agent Pool can use up to 20 different build machines. Since we have additional pipelines that move images from registry A to registry B for our GitOps, we have an additional 10 pipelines that can run. We'll put those in a separate Agent Pool so they do not interfere with builds and they can be scaled differently while also using smaller sized machines. However, even if we have two different pools, most of the requirements for the smaller image are the same in the build image. That means we can simplify our management of the image and only use one. Simplicity, I like it (y).

Now, we can build this image by hand, and at first I did. It only took about an hour or two of my time to spin up an image, install the prerequisite software, then run the script to image it in azure. If I was only doing it once per month, it might not be so bad, however it was decided upon that we would run a weekly patch schedule for our image. So, now I'm looking at almost 8 hours worth of work if I don't automate. Naturally, let's automate. 

If you're still here, you're a trooper and you deserve a prize!

[cheeky image of prize]()

For the automation, we wanted something that could be easily managed, repeatable, scheduled, etc. Now, we use Terraform in our IaC (take that however you want, IaC can be a minefield of opinions), and since we already use one HashiCorp product, why not use a second if the syntax and setup are similar? This might make it a bit easier for our juniors or new hires to dive into automation if it follows similar patterns or syntax as other tools. Based on this, I decided to use Packer for the managed image builder. 

The idea is to use Azure Pipelines on a schedule to run the Packer image generation, then once the image is generated, update the VMSS to use the new image. We'll use a separate script/cronjob to clean-up/manage our orphaned scripts that are no longer used. I'd like to keep 2-3 images as a safeguard in case anything happens during generation, I can fallback on a previous known good image.

[small chart of how it should flow]()

If you don't want to keep reading or are ready to look at the files or download them, hop on over to my [GitHub repo]() and you'll find all the files that are referenced here.

Overview of the image:

* Base OS/Image: Ubuntu 20.04 Azure Marketplace Image (non-pro)
  * This will use the 'latest' tag so it will always pull the most up-to-date
* Software Package A:
  * Git
  * Powershell
  * Docker
  * Helm
  * Yarn
  * Packer (used to build subsequent images)
* Software Package B:
  * MSSQL 2019 (at the time of writing, that's what we were using)
  * MSSQL Tools

First, let's setup our library group for our values and secrets that will be used by packer.

[image of library]()

Second, let's setup the principal account in azure that packer will use to spin up the resources and destroy them. To setup this principal, create a principal account like usual in Azure and give it contributor level permissions to the subscription. This will allow it to create and destroy the resources as it needs them. Make sure to save the principal ID and generate/save a client secret as we'll be using those later on.

[image of azure principal stuff]()

Third, the pipeline file. It's fairly simple, only a couple of tasks. 

[image of pipeline yaml]()

If you're doing this for the first time, you can use the Microsoft Hosted images, then, you can use your built image moving forward. When I ran this on the hosted agent, it took approximately 15 minutes to complete, so well within the 60 minute timeout.

The tasks will comprise of a image name generator, a validation, the build, and finally the updating of the VMSS.

We use an image name generator as to avoid collisions when creating the images. This uses a base name, like 'packerImage', and appends the build number to the end. It might be a bit redundant since we tag the image with the creation date in Azure, but it is human-readable and avoids collisions.

The Packer validation task is a 'nice to have' on the pipeline and isn't required unless you are making changes. It only takes a few seconds to run, but it will stop the pipeline if it fails.

The build task is self explanatory, it runs the Packer build command. I tried to parameterize as much as I could without going overboard. Let's dive into the buildServer.pkr.hcl file.

[image of hcl file]()

Variables:

* client_id: this is the ID of the principal you've created in Azure
* client_secret: this is the secret you generated for the principal
* subscription_id: this is the ID of the subscription in azure that'll be used
* tenant_id: this is the ID of the tenant that houses the subscription
* resource_group: this is the name of the resource group where the image will be stored when it is generated
* ubuntu_version: this is the version number of ubuntu that is desired formatted like 20.04 or 21.10
* sql_version: this is the year of MSSQL that is desired like 2019 or 2017
* sql_password: this is the password to be used for MSSQL

You'll notice that some of these variables are blank for default, and others are not. Packer requires some variables to be filled before the pipeline runs and passes in the variables (same as if in CLI), so I've filled in the required defaults for now.

You can add more variables or subtract some and hard code them, that is up to you. This is the setup I used and it is meant more as a template to start with.

The next section labeled `source "azure-arm" "ubuntuBuild"` is the section that defines all the necessary fields for azure related login or resources. Similar to terraform syntax, the second string is the descriptor ("ubuntuBuild"), and you can change this as necesary.

The third section labeled `build` is the meat and potatoes. This describes the build process and any configurations to the machine we need to make. First, we bring in the sources so the build script has that information. Second, we use the provisioner to upload a folder of files from our pipeline to the remote VM that we will use for building. Then, we run said files. Last, we run the imaging command to generalize it, and that's it.

The installation, I tried to keep as simple as possible, but with some of the tooling that we required for our builds, they just weren't avaialble in clean packages. For the installation, I've broken it up into 3 key files:

1. The installation of most of the software
2. The installation and configuration of MSSQL
3. The installation of any powershell modules

As you can tell, each file has its own unique identity.

At first, I tried to keep everything under `apt-get`, for both maintainability and simplicity. However, after awhile, I noticed that a not small amount of packages were not available on `apt-get`, but were on `snapd`. I ended up splitting the installation between the two to keep the installs as barebones as possible. This worked well. Less `curl` or `apt-key add` needed.

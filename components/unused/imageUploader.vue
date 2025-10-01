<!-- <!-- <template>
  <div class="mt-6">
    <h3 class="text-lg font-semibold mb-4">Media Preview</h3>
    <div v-if="mediaData.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="(file, index) in mediaData" :key="index"
            class="relative w-full h-60 rounded-xl overflow-hidden group">
            <button @click="removeMedia(index)"
                class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                <Icon name="clarity:close-line" size="16" />
            </button>
            <img v-if="file.type === 'image'" :src="file.url"
                class="w-full h-full object-cover z-0 cursor-pointer"
                @click="setMainDisplay(index)" />
            <video v-else autoplay loop muted class="w-full h-full object-cover cursor-pointer"
                :src="file.url" @click="setMainDisplay(index)" />
        </div>
    </div> -->

    <!-- <label v-if="!fileDisplay" for="fileInput" @drop.prevent="onDrop" @dragover.prevent="" class="
                      md:mx-0
                      mx-auto
                      mt-4
                      mb-6
                      flex 
                      flex-col 
                      items-center 
                      justify-center 
                      w-full 
                      max-w-[260px] 
                      h-[470px] 
                      text-center 
                      p-3 
                      border-2 
                      border-dashed 
                      border-gray-300 
                      rounded-lg 
                      hover:bg-gray-100 
                      cursor-pointer
                  ">
                    <Icon name="majesticons:cloud-upload" size="40" color="#b3b3b1" />
                    <div class="mt-4 text-[17px]">Select product image or video to upload</div>
                    <div class="mt-1.5 text-gray-500 text-[13px]">Or drag and drop a file</div>
                    <div class="mt-12 text-gray-400 text-sm">'mp4', 'png', 'jpg', 'jpeg', 'gif', 'webp'</div>
                    <div class="mt-2 text-gray-400 text-[13px]">Up to 10 minutes</div>
                    <div class="mt-2 text-gray-400 text-[13px]">Less than 2 GB</div>
                    <div 
                        class="px-2 py-1.5 mt-8 text-white text-[15px] w-[80%] bg-brand rounded-sm"
                        @click="openCloudinaryWidget"
                    >
                        Select file
                    </div>
                    <input ref="file" type="file" id="fileInput" @input="onChange" hidden multiple
                        accept="video/mp4, image/png, image/jpeg, image/jpg, image/gif, image/webp" />
                </label> -->
</div>

<!-- File Display Section -->
<!-- <div v-else class="
                      md:mx-0
                      mx-auto
                      mt-4
                      md:mb-12
                      mb-16
                      flex 
                      items-center 
                      justify-center 
                      w-full 
                      max-w-[260px] 
                      h-[540px] 
                      p-3 
                      rounded-2xl
                      cursor-pointer
                      relative
                  ">
                    <div v-if="fileDisplay" class="bg-black h-full w-full" />
                    <img class="absolute z-20 pointer-events-none" src="~/assets/images/mobile-case.png">
                    <img class="absolute right-4 bottom-6 z-20" width="90" src="~/assets/images/grandeur-logo.png">

                    <img v-if="fileData[0] && ['png', 'jpg', 'jpeg'].includes((fileData[0].name.split('.').pop() || '').toLowerCase())"
                        :src="fileDisplay" class="rounded-xl object-cover w-full h-full" />

                    <video v-else autoplay loop muted
                        class="absolute rounded-xl object-cover z-10 p-[13px] w-full h-full" :src="fileDisplay" />

                    <div
                        class="absolute -bottom-12 flex items-center justify-between z-50 rounded-xl border w-full p-2 border-gray-300">
                        <div class="flex items-center truncate">
                            <Icon name="clarity:success-standard-line" size="16" class="min-w-[16px]" />
                            <div class="text-[11px] pl-1 truncate text-ellipsis">{{ fileData[0]?.name }}</div>
                        </div>
                        <button @click="clearVideo" class="text-[11px] ml-2 font-semibold">
                            Change
                        </button>
                    </div>
                </div> -->

</template>

<script lang="ts" setup>
import  {type IMedia, EMediaType } from '~/models';

interface Window {
  cloudinary?: any;
}
declare var window: Window;

const mediaData = ref<IMedia[]>([])
const cloudinaryUrls = ref<string[]>([])
const file = ref<HTMLInputElement | null>(null)
const fileDisplay = ref<string | null>(null)
const errorType = ref<string | null>(null)
const caption = ref<string>('')
const fileData = ref<File[]>([])
const errors = ref<Record<string, string[]> | null>(null)
const isUploading = ref<boolean>(false)

const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac', 'wma', 'm4a', 'flv', 'avi', 'mov', 'wmv', 'mkv', '3gp', 'm4v', 'mpg', 'mpeg', 'ts', 'webm', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'odp', 'ods', 'odg', 'odf', 'ods', 'odt', 'odg', 'odf', 'odp', 'odc', 'odb', 'odf', 'odi', 'odm', 'ott', 'otp', 'ots', 'otg', 'otf', 'otc', 'otd', 'oti', 'oth', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'odp', 'ods', 'odg', 'odf', 'ods', 'odt', 'odg', 'odf', 'odp', 'odc', 'odb', 'odf', 'odi', 'odm', 'ott', 'otp', 'ots', 'otg', 'otf', 'otc', 'otd', 'oti', 'oth', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'odp', 'ods', 'odg', 'odf', 'ods', 'odt', 'odg', 'odf', 'odp', 'odc', 'odb', 'odf', 'odi', 'odm', 'ott', 'otp', 'ots', 'otg', 'otf', 'otc', 'otd', 'oti', 'oth', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'odp', 'ods', 'odg', 'odf', 'ods', 'odt', 'odg', 'odf', 'odp', 'odc', 'odb'] 




const removeMedia = (index: number) => {
  mediaData.value.splice(index, 1)
  cloudinaryUrls.value.splice(index, 1)

  if (mediaData.value.length > 0) {
    setMainDisplay(0)
  } else {
    fileDisplay.value = null
  }
}

const setMainDisplay = (index: number) => {
  fileDisplay.value = mediaData.value[index].url || null
}

onMounted(() => {
  if (!window.cloudinary) {
    const script = document.createElement('script')
    script.src = 'https://upload.widget.cloudinary.com/global/all.js'
    script.type = 'text/javascript'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      window.cloudinary.createUploadWidget(
        {
          cloudName: 'douqbebwk',
          uploadPreset: 'upload_preset',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            console.log('Done! Here is the image info: ', result.info)
          }
        }
      ).open()
    }
    document.head.appendChild(script)
  }

  const onChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  fileData.value = Array.from(input.files)
  mediaData.value = fileData.value.map((file, index) => ({
    id: index.toString(),
    url: URL.createObjectURL(file),
    type: file.type.startsWith(EMediaType.VIDEO) ? EMediaType.VIDEO : EMediaType.IMAGE,
    format: file.name.substring(file.name.lastIndexOf('.') + 1),
    updatedAt: (new Date(file.lastModified)),
    sellerId:
  }))
  if (fileData.value.length > 0) setMainDisplay(0)
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  if (!e.dataTransfer?.files) return
  const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
    allowedExtensions.includes(file.name.split('.').pop()?.toLowerCase() || '')
  )
  fileData.value = droppedFiles
  mediaData.value = droppedFiles.map((file, index) => ({
    id: index.toString(),
    url: URL.createObjectURL(file),
    type: file.type.startsWith(EMediaType.VIDEO) ? EMediaType.VIDEO : EMediaType.IMAGE,
    format: file.name.substring(file.name.lastIndexOf('.') + 1),
    updatedAt: (new Date(file.lastModified))
  }))
  if (fileData.value.length > 0) setMainDisplay(0)
}
})

</script>

const {
  MIME_TYPE_EPUB,
  OLD_UPLOAD_URL,
  UPLOAD_URL,
  UPLOAD_PATH
} = require('../utils/constant')
const fs = require('fs')
const path = require('path')
const Epub = require('../utils/epub')
const xml2js = require('xml2js').parseString

class Book {
  constructor(file, data) {
    if (file) {
      this.createBookFromFile(file)
    } else {
      this.createBookFromData(data)
    }
  }
  // 创建书籍信息
  createBookFromFile(file) {
    const {
      destination, // 文件本地存储目录
      filename, // 文件名称
      mimetype = MIME_TYPE_EPUB, // 文件资源类型
      originalname,
      path
    } = file

    const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : '' // 电子书的文件后缀名
    const oldBookPath = path // 电子书的原有路径
    const bookPath = `${destination}/${filename}${suffix}` // 电子书的新路径  
    const url = `${UPLOAD_URL}/book/${filename}${suffix}` // 电子书的下载URL 
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}` // 电子书解压后的文件夹路径
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}` // 电子书解压后的文件夹URL

    if (!fs.existsSync(unzipPath)) { //判断是否存在
      fs.mkdirSync(unzipPath, { recursive: true })
    }
    if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
      fs.renameSync(oldBookPath, bookPath)
    }

    this.fileName = filename // 文件名
    this.path = `/book/${filename}${suffix}` // epub文件相对路径
    this.filePath = this.path
    this.unzipPath = `/unzip/${filename}` // epub解压后相对路径
    this.url = url // epub文件下载链接
    this.title = '' // 书名
    this.author = '' // 作者
    this.publisher = '' // 出版社
    this.contents = [] // 目录
    this.contentsTree = [] // 树状目录结构
    this.cover = '' // 封面图片URL
    this.coverPath = '' // 封面图片路径
    this.category = -1 // 分类ID
    this.categoryText = '' // 分类名称
    this.language = '' // 语种
    this.unzipUrl = unzipUrl // 解压后文件夹链接
    this.originalName = originalname // 电子书文件的原名
  }

  createBookFromData(data) {
    this.fileName = data.fileName
    this.cover = data.coverPath
    this.title = data.title
    this.author = data.author
    this.publisher = data.publisher
    this.bookId = data.fileName
    this.language = data.language
    this.rootFile = data.rootFile
    this.originalName = data.originalName
    this.path = data.path || data.filePath
    this.filePath = data.path || data.filePath
    this.unzipPath = data.unzipPath
    this.coverPath = data.coverPath
    this.createUser = data.username
    this.createDt = new Date().getTime()
    this.updateDt = new Date().getTime()
    this.updateType = data.updateType === 0 ? data.updateType : UPDATE_TYPE_FROM_WEB
    this.contents = data.contents
  }

  parse() {
    return new Promise((resolve, reject) => {
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      if (!fs.existsSync(bookPath)) {
        reject(new Error('电子书不存在'))
      }
      const epub = new Epub(bookPath)
      epub.on('error', err => {
        reject(err)
      })
      epub.on('end', err => {
        // console.log('end', epub.manifest);
        if (err) {
          reject(err)
        } else {
          const { language, creator, creatorFileAs, title, cover, publisher } = epub.metadata
          if (!title) {
            reject(new Error('书籍名称为空'))
          } else {
            this.title = title //书名
            this.language = language || 'en'//语言
            this.author = creator || creatorFileAs || 'unknown'//作者
            this.publisher = publisher || 'unknown'//出版社
            this.rootFile = epub.rootFile
            const handleGetImage = (error, imgBuffer, mimeType) => {
              if (error) {
                reject(error)
              } else {
                const suffix = mimeType.split('/')[1]
                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`//封面存放路径
                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`

                //判断是否存在img文件夹
                if (!fs.existsSync(`${UPLOAD_PATH}/img`)) {
                  fs.mkdirSync(`${UPLOAD_PATH}/img`, { recursive: true })
                }
                fs.writeFileSync(coverPath, imgBuffer, 'binary')
                this.coverPath = `/img/${this.fileName}.${suffix}`
                this.cover = coverUrl
                resolve(this)
              }
            }

            try {
              this.unzip() // 解压电子书
              this.parseContents(epub).then(({ chapters, chapterTree }) => {
                this.contents = chapters
                this.contentsTree = chapterTree
                epub.getImage(cover, handleGetImage) // 获取封面图片
              }).catch(err => reject(err)) // 解析目录
            } catch (e) {
              reject(e)
            }
          }
        }
      })
      epub.parse()
      this.epub = epub
    })
  }

  // 电子书目录解析
  parseContents(epub) {
    // 获取ncx文件路径
    function getNcxFilePath() {
      const spine = epub && epub.spine
      const manifest = epub && epub.manifest
      const ncx = spine.toc && spine.toc.href
      const id = spine.toc && spine.toc.id
      return ncx ? ncx : manifest[id].href
    }

    // 查询当前目录的父级目录及规定层次
    function findParent(array, level = 0, pid = '') {
      return array.map(item => {
        item.level = level
        item.pid = pid
        if (item.navPoint && item.navPoint.length) {
          item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
        } else if (item.navPoint) {
          item.navPoint.level = level + 1
          item.navPoint.pid = item['$'].id
        }
        return item
      })
    }
    // 将目录转为一维数组
    function flatten(array) {
      return [].concat(...array.map(item => {
        if (item.navPoint && item.navPoint.length) {
          return [].concat(item, ...flatten(item.navPoint))
        } else if (item.navPoint) {
          return [].concat(item, item.navPoint)
        } else {
          return item
        }
      }))
    }
    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)// 获取ncx文件路径
    console.log(`${this.unzipPath}/${getNcxFilePath()}`);
    console.log(ncxFilePath);
    if (fs.existsSync(ncxFilePath)) {
      return new Promise((resolve, reject) => {
        const xml = fs.readFileSync(ncxFilePath, 'utf-8') // 读取ncx文件
        const fileName = this.fileName
        // 将ncx文件从xml转为json
        xml2js(xml, {
          explicitArray: false, // 设置为false时，解析结果不会包裹array
          ignoreAttrs: false  // 解析属性
        }, function (err, json) {
          if (err) {
            return reject(err)
          }
          const navMap = json.ncx.navMap // 获取ncx的navMap属性

          // 如果navMap属性存在navPoint属性，则说明目录存在
          if (navMap.navPoint) {
            navMap.navPoint = findParent(navMap.navPoint)
            const newNavMap = flatten(navMap.navPoint) // 将目录拆分为扁平结构
            const chapters = []
            epub.flow.forEach((chapter, index) => { // 遍历epub解析出来的目录
              // 如果目录大于从ncx解析出来的数量，则直接跳过
              if (index + 1 > newNavMap.length) {
                return
              }
              const nav = newNavMap[index] // 根据index找到对应的navMap
              chapter.text = `${UPLOAD_URL}/unzip/${fileName}/${chapter.href}` // 生成章节的URL
              chapter.label = nav && nav.navLabel ? nav.navLabel.text || '' : '' // 从ncx文件中解析出目录的标题
              chapter.level = nav.level
              chapter.pid = nav.pid
              chapter.navId = nav['$'].id
              chapter.fileName = fileName
              chapter.order = index + 1
              chapters.push(chapter)
            })
            const chapterTree = Book.genContentsTree(chapters)// 将目录转化为树状结构
            resolve({ chapters, chapterTree })
          } else {
            reject(new Error('目录解析失败，navMap.navPoint error'))
          }
        })
      })
    } else {
      throw new Error('文件目录不存在')
    }
  }
  // 解压电子书
  unzip() {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(Book.genPath(this.path)) // 解析文件路径
    zip.extractAllTo(Book.genPath(this.unzipPath), true)
  }

  static genPath(path) {
    return path.startsWith('/') ? `${UPLOAD_PATH}${path}` : `${UPLOAD_PATH}/${path}`
  }

  static genContentsTree(contents) {
    if (contents) {
      const contentsTree = []
      contents.forEach(c => {
        c.children = []
        if (c.pid === '') {
          contentsTree.push(c)
        } else {
          const parent = contents.find(_ => _.navId === c.pid)
          parent.children.push(c)
        }
      })
      return contentsTree
    }
  }
}
module.exports = Book
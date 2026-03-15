import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('股票详情页交易功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 先导航到应用页面，然后清除 localStorage 确保测试环境干净
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('1. 进入股票详情页，验证交易操作栏显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    // 检查股票名称显示
    await expect(page.locator('text=平安银行')).toBeVisible({ timeout: 10000 })

    // 检查交易操作栏存在 - 买入按钮
    const buyButton = page.getByRole('button', { name: /买入/ })
    await expect(buyButton).toBeVisible()

    // 检查卖出按钮存在
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeVisible()

    // 无持仓时应该显示提示信息
    await expect(page.locator('text=当前无持仓')).toBeVisible()
  })

  test('2. 无持仓时点击买入按钮，验证买入对话框打开', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    // 点击买入按钮
    await page.getByRole('button', { name: /买入/ }).click()

    // 验证对话框打开
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证对话框标题包含"买入"
    await expect(dialog.getByRole('heading', { name: /买入/ })).toBeVisible()

    // 验证价格输入框存在
    await expect(dialog.locator('input#buyPrice')).toBeVisible()

    // 验证数量输入框存在
    await expect(dialog.locator('input#quantity')).toBeVisible()

    // 验证止损价输入框存在
    await expect(dialog.locator('input#stopLoss')).toBeVisible()
  })

  test('3. 买入对话框中验证价格自动填充、快捷数量按钮、止损计算', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    // 点击买入按钮打开对话框
    await page.getByRole('button', { name: /买入/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证价格已自动填充（应该是当前股价）
    const priceInput = dialog.locator('input#buyPrice')
    const priceValue = await priceInput.inputValue()
    expect(parseFloat(priceValue)).toBeGreaterThan(0)

    // 验证默认数量为100
    const quantityInput = dialog.locator('input#quantity')
    const quantityValue = await quantityInput.inputValue()
    expect(quantityValue).toBe('100')

    // 验证止损价已自动填充
    const stopLossInput = dialog.locator('input#stopLoss')
    const stopLossValue = await stopLossInput.inputValue()
    expect(parseFloat(stopLossValue)).toBeGreaterThan(0)

    // 点击快捷数量按钮 500股
    await dialog.getByRole('button', { name: '500股' }).click()
    expect(await quantityInput.inputValue()).toBe('500')

    // 点击快捷数量按钮 1000股
    await dialog.getByRole('button', { name: '1000股' }).click()
    expect(await quantityInput.inputValue()).toBe('1000')

    // 点击快捷止损按钮 -5%
    const price = parseFloat(priceValue)
    await dialog.getByRole('button', { name: '-5%' }).click()
    const newStopLoss = parseFloat(await stopLossInput.inputValue())
    // 验证止损价约为 price * 0.95
    expect(Math.abs(newStopLoss - price * 0.95)).toBeLessThan(0.1)

    // 验证预估金额显示
    await expect(dialog.locator('text=预估金额')).toBeVisible()
  })

  test('4. 填写表单并确认买入，验证持仓创建成功', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    // 点击买入按钮
    await page.getByRole('button', { name: /买入/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 填写数量 - 使用 evaluate 设置 React controlled input
    const quantityInput = dialog.locator('input#quantity')
    await quantityInput.evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '200')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })

    // 点击确认买入
    await dialog.getByRole('button', { name: '确认买入' }).click()

    // 等待对话框关闭
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证持仓信息显示
    await expect(page.locator('text=持仓:')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=200股')).toBeVisible()

    // 验证按钮文字变为"加仓"
    await expect(page.getByRole('button', { name: /加仓/ })).toBeVisible()

    // 验证卖出按钮启用
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeEnabled()
  })

  test('5. 有持仓时验证持仓信息显示', async ({ page }) => {
    // 先创建持仓
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 使用 evaluate 设置买入数量
    await dialog.locator('input#quantity').evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '500')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await dialog.getByRole('button', { name: '确认买入' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证持仓信息卡片显示
    await expect(page.locator('text=持仓:')).toBeVisible()
    await expect(page.locator('text=500股')).toBeVisible()

    // 验证成本价显示
    await expect(page.locator('text=成本:')).toBeVisible()

    // 验证现价显示
    await expect(page.locator('text=现价:')).toBeVisible()

    // 验证盈亏显示
    await expect(page.locator('text=盈亏:')).toBeVisible()

    // 验证收益率显示
    await expect(page.locator('text=收益率:')).toBeVisible()
  })

  test('6. 点击卖出按钮，验证卖出对话框打开', async ({ page }) => {
    // 先创建持仓
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // 使用 evaluate 设置买入数量
    await dialog.locator('input#quantity').evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '300')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await dialog.getByRole('button', { name: '确认买入' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 点击卖出按钮
    await page.getByRole('button', { name: /卖出/ }).click()

    // 验证卖出对话框打开
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证对话框标题包含"卖出"
    await expect(dialog.getByRole('heading', { name: /卖出/ })).toBeVisible()

    // 验证卖出价格输入框
    await expect(dialog.locator('input#sellPrice')).toBeVisible()

    // 验证卖出数量输入框
    await expect(dialog.locator('input#quantity')).toBeVisible()

    // 验证持仓信息显示
    await expect(dialog.locator('text=持仓:')).toBeVisible()
    await expect(dialog.locator('text=300股')).toBeVisible()
  })

  test('7. 部分卖出验证持仓更新', async ({ page }) => {
    // 先创建持仓
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // 使用 evaluate 设置买入数量
    await dialog.locator('input#quantity').evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '500')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await dialog.getByRole('button', { name: '确认买入' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证初始持仓已创建
    await expect(page.locator('text=500股')).toBeVisible({ timeout: 5000 })

    // 验证卖出按钮已启用
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeEnabled({ timeout: 5000 })

    // 点击卖出
    await sellButton.click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 等待对话框初始化完成 - 数量应默认为全部
    const quantityInput = dialog.locator('input#quantity')
    await expect(quantityInput).toHaveValue('500', { timeout: 3000 })

    // 修改卖出数量为200（部分卖出）
    // 先聚焦输入框，然后清空并输入新值
    await quantityInput.focus()
    await quantityInput.fill('200')

    // 等待输入值更新
    await expect(quantityInput).toHaveValue('200', { timeout: 3000 })

    // 验证按钮显示"确认卖出"而非"确认清仓"
    const confirmButton = dialog.getByRole('button', { name: '确认卖出' })
    await expect(confirmButton).toBeVisible()

    // 点击确认卖出
    await confirmButton.click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证持仓更新为300股
    await expect(page.locator('text=300股')).toBeVisible({ timeout: 10000 })

    // 验证仍然有持仓信息
    await expect(page.locator('text=持仓:')).toBeVisible()
  })

  test('8. 全部卖出验证持仓清空', async ({ page }) => {
    // 先创建持仓
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // 使用 evaluate 设置买入数量
    await dialog.locator('input#quantity').evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '400')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await dialog.getByRole('button', { name: '确认买入' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 点击卖出
    await page.getByRole('button', { name: /卖出/ }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 点击"全部"快捷按钮
    await dialog.getByRole('button', { name: '全部' }).click()

    // 验证按钮文字变为"确认清仓"
    await expect(dialog.getByRole('button', { name: '确认清仓' })).toBeVisible()

    // 点击确认清仓
    await dialog.getByRole('button', { name: '确认清仓' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证持仓已清空 - 显示无持仓提示
    await expect(page.locator('text=当前无持仓')).toBeVisible({ timeout: 5000 })

    // 验证按钮文字恢复为"买入"
    await expect(page.getByRole('button', { name: /买入/ })).toBeVisible()

    // 验证卖出按钮禁用
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeDisabled()
  })

  test('9. 无持仓时卖出按钮应禁用', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    // 验证无持仓提示
    await expect(page.locator('text=当前无持仓')).toBeVisible()

    // 验证卖出按钮禁用
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeDisabled()
  })
})

test.describe('表单验证测试', () => {
  test.beforeEach(async ({ page }) => {
    // 先导航到应用页面，然后清除 localStorage 确保测试环境干净
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('买入表单验证 - 无效价格', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 清空价格
    const priceInput = dialog.locator('input#buyPrice')
    await priceInput.fill('')

    // 点击确认买入
    await dialog.getByRole('button', { name: '确认买入' }).click()

    // 验证错误提示
    await expect(dialog.locator('text=请输入有效的买入价格')).toBeVisible()
  })

  test('买入表单验证 - 无效数量', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 清空数量
    const quantityInput = dialog.locator('input#quantity')
    await quantityInput.fill('')

    // 点击确认买入
    await dialog.getByRole('button', { name: '确认买入' }).click()

    // 验证错误提示
    await expect(dialog.locator('text=请输入有效的买入数量')).toBeVisible()
  })

  test('买入表单验证 - 止损价高于买入价', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const priceInput = dialog.locator('input#buyPrice')
    const stopLossInput = dialog.locator('input#stopLoss')

    // 设置买入价 - 使用 evaluate 设置 React controlled input
    await priceInput.evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '10')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })

    // 设置止损价高于买入价
    await stopLossInput.evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '12')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })

    // 点击确认买入
    await dialog.getByRole('button', { name: '确认买入' }).click()

    // 验证错误提示
    await expect(dialog.locator('text=止损价必须低于买入价')).toBeVisible()
  })

  test('卖出表单验证 - 超过持仓数量', async ({ page }) => {
    // 先创建持仓
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // 使用 evaluate 设置买入数量
    await dialog.locator('input#quantity').evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '100')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await dialog.getByRole('button', { name: '确认买入' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证持仓已创建
    await expect(page.locator('text=100股')).toBeVisible({ timeout: 5000 })

    // 验证卖出按钮已启用
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeEnabled({ timeout: 5000 })

    // 打开卖出对话框
    await sellButton.click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 等待对话框初始化完成
    const quantityInput = dialog.locator('input#quantity')
    await expect(quantityInput).toHaveValue('100', { timeout: 3000 })

    // 输入超过持仓的数量 - 先聚焦然后填充新值
    await quantityInput.focus()
    await quantityInput.fill('500')

    // 等待输入值更新
    await expect(quantityInput).toHaveValue('500', { timeout: 3000 })

    // 验证错误提示显示
    await expect(dialog.locator('text=卖出数量不能超过持仓数量')).toBeVisible({ timeout: 5000 })

    // 验证确认按钮被禁用（因为数量超过持仓）
    const confirmButton = dialog.getByRole('button', { name: /确认/ })
    await expect(confirmButton).toBeDisabled()
  })
})

test.describe('对话框交互测试', () => {
  test.beforeEach(async ({ page }) => {
    // 先导航到应用页面，然后清除 localStorage 确保测试环境干净
    await page.goto(BASE_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('买入对话框关闭后重置表单', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    // 打开买入对话框
    await page.getByRole('button', { name: /买入/ }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 修改数量 - 使用 evaluate 设置 React controlled input
    await dialog.locator('input#quantity').evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '999')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })

    // 点击取消按钮关闭
    await dialog.getByRole('button', { name: '取消' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 再次打开对话框
    await page.getByRole('button', { name: /买入/ }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证数量已重置为默认值100
    const quantityValue = await dialog.locator('input#quantity').inputValue()
    expect(quantityValue).toBe('100')
  })

  test('卖出对话框快捷数量按钮', async ({ page }) => {
    // 先创建持仓
    await page.goto(`${BASE_URL}/stock/sz000001`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /买入/ }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 使用 evaluate 设置买入数量
    const buyQuantityInput = dialog.locator('input#quantity')
    await buyQuantityInput.evaluate((el) => {
      const input = el as HTMLInputElement
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, '1000')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await dialog.getByRole('button', { name: '确认买入' }).click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 验证持仓已创建
    await expect(page.locator('text=1000股')).toBeVisible({ timeout: 5000 })

    // 打开卖出对话框
    const sellButton = page.getByRole('button', { name: /卖出/ })
    await expect(sellButton).toBeEnabled({ timeout: 5000 })
    await sellButton.click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 等待对话框初始化完成
    const quantityInput = dialog.locator('input#quantity')
    await expect(quantityInput).toHaveValue('1000', { timeout: 3000 })

    // 测试"半仓"按钮
    await dialog.getByRole('button', { name: '半仓' }).click()
    await expect(quantityInput).toHaveValue('500', { timeout: 3000 })

    // 测试"1/3"按钮
    await dialog.getByRole('button', { name: '1/3' }).click()
    await expect(quantityInput).toHaveValue('333', { timeout: 3000 })

    // 测试"全部"按钮
    await dialog.getByRole('button', { name: '全部' }).click()
    await expect(quantityInput).toHaveValue('1000', { timeout: 3000 })
  })
})

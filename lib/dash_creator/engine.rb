module DashCreator
  class Engine < ::Rails::Engine
    isolate_namespace DashCreator

    initializer 'dash_creator.action_controller' do |app|
      ActiveSupport.on_load :action_controller do
        helper DashCreator::FilterHelper
      end
    end
  end
end
